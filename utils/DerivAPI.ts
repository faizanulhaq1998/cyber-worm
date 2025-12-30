import { ContractType } from '../types';

export interface DerivProposalParams {
  symbol: string;
  contract_type: string;
  currency: string;
  amount: number;
  duration: number;
  basis: string;
  duration_unit: string;
}

export class DerivAPI {
    appId: string;
    apiToken: string;
    wsUrl: string;
    ws: WebSocket | null;
    authorized: boolean;
    lastProposal: any;
    lastTick: number | null;
    isConnected: boolean;
    accountCurrency: string = "USD";
    
    // Request tracking
    reqIdCounter: number;
    pendingRequests: Map<number, (response: any) => void>;

    // Callbacks
    onOpen: (() => void) | null = null;
    onClose: (() => void) | null = null;
    onMessage: ((data: any) => void) | null = null;
    onError: ((error: any) => void) | null = null;

    constructor(appId: string, apiToken: string) {
        this.appId = appId;
        this.apiToken = apiToken;
        // Official Deriv WebSocket Endpoint for live trading/tick streams
        this.wsUrl = `wss://ws.derivws.com/websockets/v3?app_id=${appId}`;
        this.ws = null;
        this.authorized = false;
        this.lastProposal = null;
        this.lastTick = null;
        this.isConnected = false;
        this.reqIdCounter = 1;
        this.pendingRequests = new Map();
    }

    setToken(token: string) {
        this.apiToken = token;
    }

    connect() {
        if (this.ws) {
            if (this.ws.readyState === 1) { // 1 = OPEN
                console.log("DerivAPI: Socket already open.");
                return;
            }
            if (this.ws.readyState === 0) { // 0 = CONNECTING
                console.log("DerivAPI: Socket connecting...");
                return;
            }
            // If closing or closed, we can create a new one, but let's ensure we close old one cleanly
            try {
                this.ws.close();
            } catch (e) {
                // Ignore errors during close
            }
        }
        
        console.log(`DerivAPI: Initiating connection to ${this.wsUrl}...`);
        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
            this.isConnected = true;
            console.log("DerivAPI: Connection established.");
            if (this.onOpen) this.onOpen();
        };

        this.ws.onclose = (event) => {
            this.isConnected = false;
            this.authorized = false;
            console.warn(`DerivAPI: Connection closed. Code: ${event.code}, Reason: ${event.reason || 'No reason provided'}`);
            if (this.onClose) this.onClose();
        };

        this.ws.onerror = (event) => {
            // Browser WebSocket error events are generic and don't contain descriptive messages.
            // We log a static message to avoid [object Object] confusion.
            console.error("DerivAPI: WebSocket Network Error encountered.");
            if (this.onError) this.onError(event);
        };

        this.ws.onmessage = (msg) => {
            try {
                const data = JSON.parse(msg.data);
                
                // Internal State Management
                this._handleInternalState(data);
                
                // Request Promise Resolution
                if (data.req_id && this.pendingRequests.has(data.req_id)) {
                    const resolve = this.pendingRequests.get(data.req_id);
                    if (resolve) resolve(data);
                    this.pendingRequests.delete(data.req_id);
                }

                // Global Callback
                if (this.onMessage) this.onMessage(data);

            } catch (e) {
                console.error("DerivAPI: JSON Parse Error", e);
            }
        };
    }

    disconnect() {
        if (this.ws) {
            console.log("DerivAPI: Closing connection...");
            this.ws.close();
        }
        this.ws = null;
        this.isConnected = false;
        this.authorized = false;
        this.lastProposal = null;
        this.pendingRequests.clear();
    }

    send(data: any) {
        // Use integer 1 directly to check for OPEN state
        if (this.ws && this.ws.readyState === 1) {
            if (!data.req_id) {
                data.req_id = this.reqIdCounter++;
            }
            this.ws.send(JSON.stringify(data));
            return data.req_id;
        } else {
            console.warn(`DerivAPI: Send failed. Socket not open.`);
            return -1;
        }
    }

    _handleInternalState(data: any) {
        // If the response contains an error, we generally don't want to update internal state blindly,
        // but we might want to reset things or log.
        if (data.error) {
            console.warn("DerivAPI: Received API Error", data.error.code, data.error.message);
            // If authorization failed, mark as not authorized
            if (data.msg_type === 'authorize') {
                this.authorized = false;
            }
            return;
        }

        const msgType = data.msg_type;

        if (msgType === "authorize") {
            this.authorized = true;
            // Capture currency from the authorize response
            if (data.authorize && data.authorize.currency) {
                this.accountCurrency = data.authorize.currency;
            }
        }

        if (msgType === "proposal") {
            this.lastProposal = data;
        }

        if (msgType === "tick") {
            this.lastTick = data.tick.quote;
        }
    }

    // --- Official API Methods ---

    authorize() {
        if (!this.apiToken) {
            // It is valid to not have a token (guest mode), but authorize shouldn't be called then.
            console.error("DerivAPI: Missing API Token for authorization.");
            return;
        }
        this.send({ authorize: this.apiToken });
    }

    proposal(symbol: string = "R_100", action: ContractType = "rise", amount: number = 1, duration: number = 5, duration_unit: string = 't') {
        const contractType = action === 'rise' ? 'CALL' : 'PUT';
        const req: any = {
            proposal: 1,
            amount: amount,
            basis: "stake",
            contract_type: contractType,
            currency: this.accountCurrency, // Use dynamic currency
            duration: duration,
            duration_unit: duration_unit,
            symbol: symbol
        };
        this.send(req);
    }

    buy() {
        if (!this.lastProposal || !this.lastProposal.proposal) {
            console.error("DerivAPI: No valid proposal available to buy.");
            return;
        }

        const buyReq = {
            buy: this.lastProposal.proposal.id,
            price: this.lastProposal.proposal.ask_price
        };
        this.send(buyReq);
    }

    ticks_subscribe(symbol: string = "R_100") {
        this.send({ ticks: symbol, subscribe: 1 });
    }
    
    forget_all_ticks() {
        this.send({ forget_all: 'ticks' });
    }
    
    forget(id: string) {
        this.send({ forget: id });
    }

    ping() {
        this.send({ ping: 1 });
    }

    balance(subscribe: boolean = true) {
        const req: any = { balance: 1 };
        if (subscribe) {
            req.subscribe = 1;
        }
        this.send(req);
    }

    active_symbols(active_symbols = 'brief', product_type = 'basic') {
        this.send({ active_symbols, product_type });
    }
    
    proposal_open_contract(contractId?: string) {
        const req: any = {
            proposal_open_contract: 1,
            subscribe: 1
        };
        if (contractId) {
            req.contract_id = contractId;
        }
        this.send(req);
    }
}
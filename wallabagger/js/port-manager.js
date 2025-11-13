'use strict';

class PortManager {
    port = null;
    connected = false;

    static #backgroundPortIsConnectedEventName = 'background-port-is-connected';
    #messagesQueue = [];

    constructor (name, listeners) {
        this.name = name;
        this.#init(listeners);
    }

    postMessage (msg) {
        if (this.connected === true) {
            this.#log('Sending message', msg);
            this.port.postMessage(msg);
        } else {
            this.#log('Queuing message:', msg);
            this.#messagesQueue.push(msg);
        }
    }

    backgroundPortIsConnected () {
        this.#postIsConnected();
        this.#startQueueConsuming();
    }

    static get backgroundPortIsConnectedEventName () {
        return this.#backgroundPortIsConnectedEventName;
    }

    #init (listeners) {
        this.port = browser.runtime.connect({ name: this.name });

        this.port.onMessage.addListener(listeners);

        this.port.onDisconnect.addListener(function () {
            this.#log('Port disconnected, attempting to reconnect...');
            setTimeout(this.#init(listeners).bind(this), 1000);
        });
    }

    #log (...msg) {
        console.log(...msg);
    }

    #startQueueConsuming () {
        this.#messagesQueue.forEach((msg) => this.postMessage(msg));
        this.#messagesQueue.length = 0;
    }

    #postIsConnected () {
        this.connected = true;
    }
}

export { PortManager };

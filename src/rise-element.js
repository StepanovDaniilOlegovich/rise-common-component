import { LitElement } from "lit-element";
import { PolymerElement } from "@polymer/polymer";
import { dedupingMixin } from "@polymer/polymer/lib/utils/mixin.js";

import { LoggerMixin } from "./logger-mixin.js";
import { version } from "./rise-element-version.js";


export const RiseElementMixin = dedupingMixin( base => {

    const riseElementBase = LoggerMixin( base );

    class riseElement extends riseElementBase {

      static get properties() {
        return {
        /**
         * Component version; should override when implementing
         */
          version: {
            type: String,
            value: version,
            readOnly: true
          }
        }
      }

      // Event name constants
      static get EVENT_CONFIGURED() {
        return "configured";
      }
      static get EVENT_START() {
        return "start";
      }

      constructor() {
        super();

        this._uptimeError = false;
      }

      connectedCallback() {
        super.connectedCallback();
        this._uptimeHandler = this._handleUptimeRequest.bind( this );
        window.addEventListener( "component-uptime-request", this._uptimeHandler );
      }

      disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener( "component-uptime-request", this._uptimeHandler );
      }

      ready() {
        super.ready();

        this._onReady();
      }

      firstUpdated( properties ) {
        super.firstUpdated( properties );

        this._onReady();
      }

      _onReady() {
        super.initLogger({
          name: this.tagName.toLowerCase(),
          id: this.id,
          version: this.version
        });

        if ( RisePlayerConfiguration.isConfigured()) {
          this._init();
        } else {
          const init = () => this._init();

          window.addEventListener( "rise-components-ready", init, { once: true });
        }
      }

      isOffline() {
        return new Promise(( resolve ) => {
          fetch( "https://widgets.risevision.com", { method: "HEAD" })
            .then(() => {
              resolve( false );
            }).catch(() => {
              resolve( true );
            });
        });
      }

      _init() {
        console.log( "configuring start" ); // eslint-disable-line no-console
        this.addEventListener( riseElement.EVENT_START, this._handleStart, { once: true });

        this._sendEvent( riseElement.EVENT_CONFIGURED );
      }

      _sendEvent( eventName, detail = {}) {
        const event = new CustomEvent( eventName, {
          bubbles: true, composed: true, detail
        });

        this.dispatchEvent( event );
      }

      _handleStart() {
        console.log( "handling start" ); // eslint-disable-line no-console
        super.log( riseElement.LOG_TYPE_INFO, "start received" );
      }

      _handleUptimeRequest() {
        window.dispatchEvent( new CustomEvent( "component-uptime-result", {
          detail: {
            component_id: this.id,
            component_type: this.tagName.toLowerCase(),
            error: this._uptimeError
          }
        }));
      }

      _setUptimeError( value ) {
        this._uptimeError = value;
      }

      _sendDoneEvent( done ) {
        this._sendEvent( "report-done", { done });
      }

    }

    return riseElement;
  }),
  RiseElement = RiseElementMixin( PolymerElement ),
  RiseLitElement = RiseElementMixin( LitElement );

if ( !customElements.get( "rise-element" )) {
  customElements.define( "rise-element", RiseElement );
}

if ( !customElements.get( "rise-lit-element" )) {
  customElements.define( "rise-lit-element", RiseLitElement );
}

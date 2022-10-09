import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { $fetch } from 'ohmyfetch';

@customElement('my-form')
export class MyForm extends LitElement {
  @property() _chaindId = '137';
  @property() _nftTokenId = '335188';
  @property() _owner = '0x5231555186e4502bdB603c9E42Ae47f93C54d99D';

  render() {
    return html`
      <div>
        <label>Chain Id</label>
        <div>
          <input
            id="chainid"
            type="text"
            value="${this._chaindId}"
            @keyup=${(e) => (this._chaindId = e.target.value)}
          />
        </div>
      </div>
      <div>
        <label>Token Id</label>
        <div>
          <input
            type="text"
            value="${this._nftTokenId}"
            @keyup=${(e) => (this._nftTokenId = e.target.value)}
          />
        </div>
      </div>
      <div>
        <label>Owner Address</label>
        <div>
          <input
            type="text"
            value="${this._owner}"
            @keyup=${(e) => (this._owner = e.target.value)}
          />
        </div>
      </div>
      <div>
        <button @click=${this._getPosition}>Submit</button>
      </div>
    `;
  }

  async _getPosition() {
    if (!this._chaindId || !this._nftTokenId || !this._owner)
      throw 'empty values';

    const payload = {
      chainId: this._chaindId,
      tokenId: this._nftTokenId,
      owner: this._owner,
    };

    this.dispatchEvent(new CustomEvent('position', { detail: payload }));
  }
}

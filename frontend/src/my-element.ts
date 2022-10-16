import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { $fetch } from 'ohmyfetch';
import litLogo from './assets/lit.svg';
import './my-form';

/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement('my-element')
export class MyElement extends LitElement {
  private readonly _storageKey = 'positionIds';
  private _rowButtons = [
    {
      name: 'delete',
      func: (record: Position) => {
        return () => {
          this._positions = this._positions.filter(
            (x) =>
              !(x.chainId == record.chainId && x.tokenId == record.tokenId),
          );
          const storedPositionIds = localStorage.getItem(this._storageKey);
          const parsed = JSON.parse(storedPositionIds || '[]');
          const filtered = parsed.filter(
            (x) =>
              !(x.chainId == record.chainId && x.tokenId == record.tokenId),
          );
          localStorage.setItem(this._storageKey, JSON.stringify(filtered));
        };
      },
    },
  ];
  /**
   * Copy for the positions
   */
  @property()
  _positions: Position[] = [];

  // @property()
  // _raw_positions: any[] = [];

  /**
   * Table Columns
   */
  @property()
  _columns: string[] = [
    'chainId',
    'tokenId',
    'owner',
    'USDC',
    'WETH',
    'WMATIC',
    'lower',
    'upper',
    'boundaryLen',
  ];

  /**
   * fetching flag
   */
  @property()
  _fetching = false;

  connectedCallback() {
    super.connectedCallback();
    this.fetchAll();
  }

  async fetchAll() {
    const storedPositionIds = localStorage.getItem(this._storageKey);
    const params = JSON.parse(storedPositionIds || '[]');

    this._fetching = true;
    const promises: any[] = [];

    for (const p of params) {
      const addPosition = this._getPosition(p).then((position) => {
        this._positions.push(this._formatRawPosition({ params: p, position }));
      });
      promises.push(addPosition);
    }

    Promise.all(promises).then((data) => {
      this._fetching = false;
    });
  }

  render() {
    return html`
      <my-form @position=${this._handleForm}></my-form>

      <table style="padding-top: 50px">
        <thead>
          <tr>
            ${this._columns.map((name) => html`<th>${name}</th>`)}
          </tr>
        </thead>
        <tbody>
          ${this._positions.map((record) => {
            return html`<tr>
              ${[
                ...this._columns.map((col) => {
                  return html`<td>${record[col]}</td>`;
                }),
                ...this._rowButtons.map((x) => {
                  return html`<td
                    style="cursor: pointer"
                    @click=${x.func(record)}
                  >
                    ${x.name}
                  </td>`;
                }),
              ]}
            </tr>`;
          })}
        </tbody>
      </table>
      <div style="padding-top: 100px">
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" class="logo" alt="Vite logo" />
        </a>
        <a href="https://lit.dev" target="_blank">
          <img src=${litLogo} class="logo lit" alt="Lit logo" />
        </a>
      </div>
    `;
  }

  async _getPosition(params: {
    chainId: string;
    tokenId: string;
    owner: string;
  }) {
    return $fetch('http://localhost:3000/api/position', {
      method: 'GET',
      params: {
        chainId: params.chainId,
        tokenId: params.tokenId,
        owner: params.owner,
      },
    });
  }

  /**
   * Add the position data coming from outside,
   * to add to the storage of positions
   * @param e payload of position data
   */
  private async _handleForm(e: CustomEvent) {
    const position = await this._getPosition(e.detail);
    const storedPositionIds = localStorage.getItem(this._storageKey);
    const parsed = JSON.parse(storedPositionIds || '[]');
    parsed.push(e.detail);
    localStorage.setItem(this._storageKey, JSON.stringify(parsed));
    const raw_position = { position, params: e.detail };
    this._positions = [
      this._formatRawPosition(raw_position),
      ...this._positions,
    ];
  }

  /**
   * This creates the record and columns to build the table from
   * @param x
   * @returns
   */
  private _formatRawPosition = (x: any): Position => {
    const pair = x.position.pair;
    const pairKeys = Object.keys(pair);
    return {
      chainId: x.params.chainId,
      tokenId: x.params.tokenId,
      owner: x.params.owner.slice(0, 6) + '...' + x.params.owner.slice(-4),
      [pairKeys[0]]: pair[pairKeys[0]].fee,
      [pairKeys[1]]: pair[pairKeys[1]].fee,
      lower: Number(x.position.tickLower).toFixed(5),
      upper: Number(x.position.tickUpper).toFixed(5),
      boundaryLen: (
        Number(x.position.tickUpper) - Number(x.position.tickLower)
      ).toFixed(5),
      Today: 0,
      R7Avg: 0,
      R30Avg: 0,
    };
  };

  // private _refreshPositions = () => {
  //   this._positions = this._raw_positions.map(this._formatRawPosition);
  // };

  static styles = css`
    :host {
      max-width: 1280px;
      margin: 0 auto;
      padding: 2rem;
      text-align: center;
    }

    .logo {
      height: 6em;
      padding: 1.5em;
      will-change: filter;
    }
    .logo:hover {
      filter: drop-shadow(0 0 2em #646cffaa);
    }
    .logo.lit:hover {
      filter: drop-shadow(0 0 2em #325cffaa);
    }

    .card {
      padding: 2em;
    }

    .read-the-docs {
      color: #888;
    }

    h1 {
      font-size: 3.2em;
      line-height: 1.1;
    }

    a {
      font-weight: 500;
      color: #646cff;
      text-decoration: inherit;
    }
    a:hover {
      color: #535bf2;
    }

    button {
      border-radius: 8px;
      border: 1px solid transparent;
      padding: 0.6em 1.2em;
      font-size: 1em;
      font-weight: 500;
      font-family: inherit;
      background-color: #1a1a1a;
      cursor: pointer;
      transition: border-color 0.25s;
    }
    button:hover {
      border-color: #646cff;
    }
    button:focus,
    button:focus-visible {
      outline: 4px auto -webkit-focus-ring-color;
    }

    @media (prefers-color-scheme: light) {
      a:hover {
        color: #747bff;
      }
      button {
        background-color: #f9f9f9;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'my-element': MyElement;
  }

  interface Position {
    chainId: number;
    tokenId: number;
    owner: string;
    lower: string;
    upper: string;
    boundaryLen: string;
    Today: number;
    R7Avg: number;
    R30Avg: number;
    [tokenName: string]: string | number;
  }
}

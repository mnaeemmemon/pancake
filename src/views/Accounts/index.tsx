import React from 'react'

import Page from 'components/layout/Page';
import './Account.css'

const Accounts = () => {
    return (
        <>
            <Page>
                <p style={{ color: 'rgb(195 197 203);' }}>Wallet Analytics</p>
                <div className="serachArea">
                    <div className="inputdiv">
                        <input placeholder="Ox.." className="inputAd" />
                        <button type="button" className="btnAdd">Add detail</button>
                    </div>





                </div>
                <div className="lastDiv">
                    <div className="innerlastDiv">
                        <div className="saveAccount">
                            Save Account
                        </div>

                    </div>
                    <div className="diveLine" />

                    <span className="noSave">No Save account</span>
                </div>
            </Page>

        </>
    )
}
export default Accounts;
import { useNuiFocus, useNuiEvent } from '@public/nui/hook/nui';
import { BankData } from '@public/shared/nui/bank';

import { FunctionComponent, useEffect, useState } from 'react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { fetchNui } from '@public/nui/fetch';
import { NuiEvent } from '@public/shared/event';
import { groupDigits } from '@public/shared/utils/number';

type TabProps = {
    bank: BankData;
};
const playerAccountReg = /^[0-9]{3}Z[0-9]{4}T[0-9]{3}$/;

const accountDeposit = async (data: BankData, value: number) => {
    await fetchNui(NuiEvent.BankDeposit, {
        data,
        value,
    });
};
const accountWithdraw = async (data: BankData, value: number) => {
    await fetchNui(NuiEvent.BankWithdraw, {
        data,
        value,
    });
};
const HomeTab: FunctionComponent<TabProps> = ({ bank }) => {
    return (
        <>
            <div
                className="tab-pane fade show active"
                id="bankingHome"
                role="tabpanel"
                aria-labelledby="bankingHome-tab"
                style={{ position: 'relative', top: '54px' }}
            >
                <div className="container-fluid p-2">
                    <div className="row">
                        <div className="col-12 title">
                            <h3 style={{ fontSize: '35px' }}>Bienvenue, {bank.information.accountinfo}</h3>
                        </div>
                    </div>
                    <div className="row" id="successRow" style={{ display: 'none' }}>
                        <div className="col-12">
                            <div className="alert alert-success" role="alert" id="successMessage"></div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-6">
                            <div className="card mb-3" style={{ color: 'white' }}>
                                <div className="card-header">
                                    <i className="fad fa-fw fa-money-bill-wave"></i> Solde bancaire actuel
                                </div>
                                <div className="card-body">
                                    <h5
                                        className="card-title"
                                        style={{ fontWeight: 'bolder', color: '#28a745' }}
                                        id="currentBalance"
                                    >
                                        {groupDigits(bank.information.bankbalance)}$
                                    </h5>
                                    <p className="card-text" style={{ color: 'white' }}>
                                        Montant total disponible pour retrait/transfert
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="card mb-3" style={{ color: 'white' }}>
                                <div className="card-header">
                                    <i className="fad fa-fw fa-coin"></i> Solde de trésorerie actuel
                                </div>
                                <div className="card-body">
                                    <h5
                                        className="card-title"
                                        style={{ fontWeight: 'bolder', color: '#28a745' }}
                                        id="currentCashBalance"
                                    >
                                        {groupDigits(bank.information.money)}$
                                    </h5>
                                    <p className="card-text" style={{ color: 'white' }}>
                                        Montant total disponible pour le dépôt
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-12">
                            <div className="card mb-3">
                                <div className="card-header" style={{ color: 'white' }}>
                                    <i className="fad fa-fw fa-pencil-alt"></i>Actions rapides
                                </div>
                                <div className="card-body">
                                    <div className="container-fluid">
                                        <div className="row m-1" id="bankingDeposit-buttons">
                                            <div className="col-4 d-grid">
                                                <button
                                                    className="btn btn-primary btn-block"
                                                    onClick={() => accountDeposit(bank, 100)}
                                                >
                                                    Déposer $100
                                                </button>
                                            </div>
                                            <div className="col-4 d-grid">
                                                <button
                                                    className="btn btn-primary btn-block"
                                                    onClick={() => accountDeposit(bank, 1000)}
                                                >
                                                    Déposer $1,000
                                                </button>
                                            </div>
                                            <div className="col-4 d-grid">
                                                <button
                                                    className="btn btn-primary btn-block"
                                                    onClick={() => accountDeposit(bank, 10000)}
                                                >
                                                    Déposer $10,000
                                                </button>
                                            </div>
                                        </div>
                                        <div className="row m-1">
                                            <div className="col-4 d-grid">
                                                <button
                                                    className="btn btn-secondary btn-block"
                                                    onClick={() => accountWithdraw(bank, 100)}
                                                >
                                                    Retirer $100
                                                </button>
                                            </div>
                                            <div className="col-4 d-grid">
                                                <button
                                                    className="btn btn-secondary btn-block"
                                                    onClick={() => accountWithdraw(bank, 1000)}
                                                >
                                                    Retirer $1,000
                                                </button>
                                            </div>
                                            <div className="col-4 d-grid">
                                                <button
                                                    className="btn btn-secondary btn-block"
                                                    onClick={() => accountWithdraw(bank, 10000)}
                                                >
                                                    Retirer $10,000
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
/*
const WithdrawTab: FunctionComponent<TabProps> = ({ bank }) => {
    return (
        <>
            <h3 className="text-3xl mb-4">Roues</h3>
            <div className="grid grid-cols-2">
                {Object.keys(analyze.condition.tireHealth).map(wheel => {
                    const index = parseInt(wheel, 10);
                    const health = analyze.condition.tireHealth[index];
                    const burst = analyze.condition.tireBurstState[index];
                    const completelyBurst = analyze.condition.tireBurstCompletely[index];
                    const burstDistance = analyze.condition.tireTemporaryRepairDistance[index];

                    if (health <= 0.01 && !burst && !completelyBurst) {
                        return null;
                    }

                    return (
                        <div className="my-4" key={wheel}>
                            <h5 className="text-xl">{WHEEL_LABEL[wheel]}</h5>
                            <p>Pneu neuf : {burstDistance === undefined ? 'Oui' : 'Non'}</p>
                            {burstDistance !== undefined && (
                                <p>Vie restante : {((10000 - burstDistance) / 1000).toFixed(2)} km</p>
                            )}
                            <p>Crevaison : {burst ? 'Oui' : 'Non'}</p>
                            <p>Sur les jantes : {completelyBurst ? 'Oui' : 'Non'}</p>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

const DepositTab: FunctionComponent<TabProps> = ({ bank }) => {
    return (
        <>
            <h3 className="text-3xl mb-4">Vitres</h3>

            <div className="grid grid-cols-2">
                {Object.keys(analyze.condition.windowStatus).map(index => {
                    if (!analyze.windows[index]) {
                        return null;
                    }

                    return (
                        <div className="mt-2" key={index}>
                            <h5 className="text-xl">{WINDOWS_LABEL[index]}</h5>
                            <p>Cassé : {analyze.condition.windowStatus[index] ? 'Oui' : 'Non'}</p>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

const TransferTab: FunctionComponent<TabProps> = ({ bank }) => {
    return (
        <>
            <h3 className="text-3xl mb-4">Portières</h3>

            <div className="grid grid-cols-2">
                {analyze.doors.map(index => {
                    return (
                        <div className="mt-2" key={index}>
                            <h5 className="text-xl">{DOOR_LABELS[index]}</h5>
                            <p>Cassé : {analyze.condition.doorStatus[index] ? 'Oui' : 'Non'}</p>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

const OffshoreTab: FunctionComponent<TabProps> = ({ bank }) => {
    return (
        <>
            <h3 className="text-3xl mb-4">Carrosserie</h3>
            <p>Etat de la carrosserie : {analyze.condition.bodyHealth.toFixed(2)} / 1000</p>
        </>
    );
};

const ActionsTab: FunctionComponent<TabProps> = ({ bank }) => {
    return (
        <>
            <h3 className="text-3xl mb-4">Réservoir</h3>
            <p>Etat du réservoir : {((analyze.condition.tankHealth - 600) * 2.5).toFixed(2)} / 1000</p>
            <p>Essence : {analyze.condition.fuelLevel.toFixed(2)} / 100</p>
        </>
    );
};
*/
export const BankApp: FunctionComponent = () => {
    const [bankData, setBankData] = useState<BankData>(null);
    console.log(bankData);
    useNuiFocus(bankData !== null, bankData !== null, false);
    useNuiEvent('bank', 'open', (bank: BankData) => setBankData(bank));
    if (!bankData) {
        return null;
    }

    return (
        <MemoryRouter>
            <div className="container">
                <div className="row">
                    <div className="col-3">
                        <div className="container-fluid d-flex flex-column justify-content-around">
                            <div className="row">
                                <div className="col-12">
                                    <img className="img-fluid py-5" src="/public/images/bank/logo.png" />
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-12">
                                    <div
                                        className="nav flex-column nav-pills p-2 shadow-lg"
                                        style={{ borderRadius: '5px' }}
                                    >
                                        <Link
                                            style={{
                                                color: 'white',
                                            }}
                                            className="nav-link m-1"
                                            to="/"
                                        >
                                            <span>Accueil</span>
                                        </Link>
                                        <Link
                                            style={{
                                                color: 'white',
                                            }}
                                            className="nav-link m-1"
                                            to="/withdraw"
                                        >
                                            <span>Retrait</span>
                                        </Link>
                                        <Link
                                            style={{
                                                color: 'white',
                                            }}
                                            className="nav-link m-1"
                                            to="/deposit"
                                        >
                                            <span>Dépôt</span>
                                        </Link>
                                        <Link
                                            style={{
                                                color: 'white',
                                            }}
                                            className="nav-link m-1"
                                            to="/transfer"
                                        >
                                            <span>Transfert</span>
                                        </Link>
                                        <Link
                                            style={{
                                                color: 'white',
                                            }}
                                            className="nav-link m-1"
                                            to="/offshore"
                                        >
                                            <span>Compte OffShore</span>
                                        </Link>
                                        {!playerAccountReg.test(bankData.information.accountinfo) && (
                                            <Link
                                                style={{
                                                    color: 'white',
                                                }}
                                                className="nav-link m-1"
                                                to="/actions"
                                            >
                                                <span>Option du compte</span>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                                <div className="col-12 mt-2">
                                    <div className="col-12">
                                        {playerAccountReg.test(bankData.information.accountinfo) && (
                                            <div
                                                id="accountNumberCard"
                                                className="card mb-3"
                                                style={{ color: 'white' }}
                                            >
                                                <div className="card-header">Identifiant du compte</div>
                                                <div className="card-body">
                                                    <p className="card-text" style={{ color: 'white' }}>
                                                        <span id="accountNumber">
                                                            {bankData.information.accountinfo}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-9" style={{ paddingLeft: 0, paddingRight: 0 }}>
                        <div>
                            <Routes>
                                <Route path="/" element={<HomeTab bank={bankData} />} />
                            </Routes>
                        </div>
                    </div>
                </div>
            </div>
        </MemoryRouter>
    );
    /*
    return (
        <MemoryRouter>
            <div className="container" id="bankingContainer">
                <div className="row">
                    <div className="col-3">
                        <div
                            className="container-fluid d-flex flex-column justify-content-around"
                            style={{
                                height: '100%',
                            }}
                        >
                            <div className="row">
                                <div className="col-12">
                                    <img src="images/logo.png" className="img-fluid py-5" />
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-12">
                                    <div
                                        className="nav flex-column nav-pills p-2 shadow-lg"
                                        id="v-pills-tab"
                                        role="tablist"
                                        aria-orientation="vertical"
                                        style={{
                                            borderRadius: 5,
                                        }}
                                    >
                                        <a
                                            className="nav-link active m-1"
                                            id="bankingHome-tab"
                                            data-toggle="pill"
                                            href="#bankingHome"
                                            role="tab"
                                            aria-controls="bankingHome"
                                            aria-selected="true"
                                            style={{
                                                color: 'white',
                                            }}
                                        >
                                            Accueil
                                        </a>
                                        <a
                                            className="nav-link m-1"
                                            id="bankingWithdraw-tab"
                                            data-toggle="pill"
                                            href="#bankingWithdraw"
                                            role="tab"
                                            aria-controls="bankingWithdraw"
                                            aria-selected="false"
                                            style={{
                                                color: 'white',
                                            }}
                                        >
                                            Retrait
                                        </a>
                                        <a
                                            className="nav-link m-1"
                                            id="bankingDeposit-tab"
                                            data-toggle="pill"
                                            href="#bankingDeposit"
                                            role="tab"
                                            aria-controls="bankingDeposit"
                                            aria-selected="false"
                                            style={{
                                                color: 'white',
                                            }}
                                        >
                                            Dépôt
                                        </a>
                                        <a
                                            className="nav-link m-1"
                                            id="bankingTransfer-tab"
                                            data-toggle="pill"
                                            href="#bankingTransfer"
                                            role="tab"
                                            aria-controls="bankingTransfer"
                                            aria-selected="false"
                                            style={{
                                                color: 'white',
                                            }}
                                        >
                                            Transfert
                                        </a>
                                        <a
                                            className="nav-link m-1"
                                            id="bankingOffShore-tab"
                                            style={{
                                                display: 'none',
                                                color: 'white',
                                            }}
                                            data-toggle="pill"
                                            href="#bankingOffShore"
                                            role="tab"
                                            aria-controls="bankingOffShore"
                                            aria-selected="false"
                                        >
                                            Compte OffShore
                                        </a>
                                        <a
                                            className="nav-link m-1"
                                            id="bankingActions-tab"
                                            data-toggle="pill"
                                            href="#bankingActions"
                                            role="tab"
                                            aria-controls="bankingActions"
                                            aria-selected="false"
                                            style={{
                                                color: 'white',
                                            }}
                                        >
                                            Option du compte
                                        </a>
                                    </div>
                                </div>
                                <div className="col-12 mt-2">
                                    <div className="col-12">
                                        <div
                                            id="accountNumberCard"
                                            className="card mb-3"
                                            style={{
                                                color: 'white',
                                            }}
                                        >
                                            <div className="card-header">Identifiant du compte</div>
                                            <div className="card-body">
                                                <p
                                                    className="card-text"
                                                    style={{
                                                        color: 'white',
                                                    }}
                                                >
                                                    <span id="accountNumber" />
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-12 d-grid">
                                    <button
                                        className="btn btn-block"
                                        id="logoffbutton"
                                        style={{
                                            backgroundColor: '#f52d2d',
                                            color: 'white',
                                        }}
                                    >
                                        Se déconnecter
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div
                        className="col-9"
                        style={{
                            paddingLeft: 0,
                            paddingRight: 0,
                        }}
                    >
                        {}
                        <div
                            className="tab-content p-1 shadow-lg"
                            id="v-pills-tabContent"
                            style={{
                                height: '70vh',
                            }}
                        >
                            <div
                                className="tab-pane fade show active"
                                id="bankingHome"
                                role="tabpanel"
                                aria-labelledby="bankingHome-tab"
                                style={{
                                    position: 'relative',
                                    top: 54,
                                }}
                            >
                                <div className="container-fluid p-2">
                                    <div className="row">
                                        <div className="col-12 title">
                                            <h3
                                                style={{
                                                    fontSize: 35,
                                                }}
                                            >
                                                Bienvenue, <span id="customerName" />
                                            </h3>
                                        </div>
                                    </div>
                                    <div
                                        className="row"
                                        id="successRow"
                                        style={{
                                            display: 'none',
                                        }}
                                    >
                                        <div className="col-12">
                                            <div className="alert alert-success" role="alert" id="successMessage" />
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-6">
                                            <div
                                                className="card mb-3"
                                                style={{
                                                    color: 'white',
                                                }}
                                            >
                                                <div className="card-header">
                                                    <i className="fad fa-fw fa-money-bill-wave" /> Solde bancaire actuel
                                                </div>
                                                <div className="card-body">
                                                    <h5
                                                        className="card-title"
                                                        style={{
                                                            fontWeight: 'bolder',
                                                            color: '#28a745',
                                                        }}
                                                        id="currentBalance"
                                                    />
                                                    <p
                                                        className="card-text"
                                                        style={{
                                                            color: 'white',
                                                        }}
                                                    >
                                                        Montant total disponible pour retrait/transfert
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div
                                                className="card mb-3"
                                                style={{
                                                    color: 'white',
                                                }}
                                            >
                                                <div className="card-header">
                                                    <i className="fad fa-fw fa-coin" /> Solde de trésorerie actuel
                                                </div>
                                                <div className="card-body">
                                                    <h5
                                                        className="card-title"
                                                        style={{
                                                            fontWeight: 'bolder',
                                                            color: '#28a745',
                                                        }}
                                                        id="currentCashBalance"
                                                    />
                                                    <p
                                                        className="card-text"
                                                        style={{
                                                            color: 'white',
                                                        }}
                                                    >
                                                        Montant total disponible pour le dépôt
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-12">
                                            <div className="card mb-3">
                                                <div
                                                    className="card-header"
                                                    style={{
                                                        color: 'white',
                                                    }}
                                                >
                                                    <i className="fad fa-fw fa-pencil-alt" />
                                                    Actions rapides
                                                </div>
                                                <div className="card-body">
                                                    <div className="container-fluid">
                                                        <div className="row m-1" id="bankingDeposit-buttons">
                                                            <div className="col-4 d-grid">
                                                                <button
                                                                    className="btn btn-primary btn-block"
                                                                    data-action="deposit"
                                                                    data-amount={100}
                                                                >
                                                                    Déposer $100
                                                                </button>
                                                            </div>
                                                            <div className="col-4 d-grid">
                                                                <button
                                                                    className="btn btn-primary btn-block"
                                                                    data-action="deposit"
                                                                    data-amount={1000}
                                                                >
                                                                    Déposer $1,000
                                                                </button>
                                                            </div>
                                                            <div className="col-4 d-grid">
                                                                <button
                                                                    className="btn btn-primary btn-block"
                                                                    data-action="deposit"
                                                                    data-amount={10000}
                                                                >
                                                                    Déposer $10,000
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="row m-1">
                                                            <div className="col-4 d-grid">
                                                                <button
                                                                    className="btn btn-secondary btn-block"
                                                                    data-action="withdraw"
                                                                    data-amount={100}
                                                                >
                                                                    Retirer $100
                                                                </button>
                                                            </div>
                                                            <div className="col-4 d-grid">
                                                                <button
                                                                    className="btn btn-secondary btn-block"
                                                                    data-action="withdraw"
                                                                    data-amount={1000}
                                                                >
                                                                    Retirer $1,000
                                                                </button>
                                                            </div>
                                                            <div className="col-4 d-grid">
                                                                <button
                                                                    className="btn btn-secondary btn-block"
                                                                    data-action="withdraw"
                                                                    data-amount={10000}
                                                                >
                                                                    Retirer $10,000
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div
                                className="tab-pane fade"
                                id="bankingWithdraw"
                                role="tabpanel"
                                aria-labelledby="bankingWithdraw-tab"
                            >
                                <div
                                    className="container-fluid p-2"
                                    style={{
                                        position: 'relative',
                                        top: 54,
                                    }}
                                >
                                    <div className="row">
                                        <div className="col-12 title">
                                            <h3
                                                style={{
                                                    fontSize: 35,
                                                }}
                                            >
                                                Retrait
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div
                                            className="col-12"
                                            style={{
                                                fontSize: 12,
                                                color: 'white',
                                            }}
                                        >
                                            Retrait d'argent de votre compte bancaire.
                                        </div>
                                    </div>
                                    <div
                                        className="row"
                                        style={{
                                            position: 'relative',
                                            top: 20,
                                        }}
                                    >
                                        <div className="col-6">
                                            <div
                                                className="card mb-3"
                                                style={{
                                                    color: 'white',
                                                }}
                                            >
                                                <div className="card-header">
                                                    <i className="fad fa-fw fa-money-bill-wave" /> Solde bancaire actuel
                                                </div>
                                                <div className="card-body">
                                                    <h5
                                                        className="card-title"
                                                        style={{
                                                            fontWeight: 'bolder',
                                                            color: '#28a745',
                                                        }}
                                                        id="currentBalance1"
                                                    />
                                                    <p
                                                        className="card-text"
                                                        style={{
                                                            color: 'white',
                                                        }}
                                                    >
                                                        Montant total disponible pour retrait/transfert
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div
                                                className="card mb-3"
                                                style={{
                                                    color: 'white',
                                                }}
                                            >
                                                <div className="card-header">
                                                    <i className="fad fa-fw fa-coin" /> Argent actuel
                                                </div>
                                                <div className="card-body">
                                                    <h5
                                                        className="card-title"
                                                        style={{
                                                            fontWeight: 'bolder',
                                                            color: '#28a745',
                                                        }}
                                                        id="currentCashBalance1"
                                                    />
                                                    <p
                                                        className="card-text"
                                                        style={{
                                                            color: 'white',
                                                        }}
                                                    >
                                                        Montant total disponible pour le dépôt
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className="row"
                                        style={{
                                            position: 'relative',
                                            top: 20,
                                        }}
                                    >
                                        <div className="col-12">
                                            <div
                                                className="card mb-3"
                                                style={{
                                                    color: 'white',
                                                }}
                                            >
                                                <div className="card-body">
                                                    <div className="container-fluid">
                                                        <div
                                                            className="row"
                                                            id="withdrawError"
                                                            style={{
                                                                display: 'none',
                                                            }}
                                                        >
                                                            <div className="col-12">
                                                                <div
                                                                    className="alert alert-danger"
                                                                    role="alert"
                                                                    id="withdrawErrorMsg"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="row mt-2">
                                                            <div
                                                                className="col-3 my-auto"
                                                                style={{
                                                                    fontSize: 19,
                                                                    color: 'white',
                                                                }}
                                                            >
                                                                <label htmlFor="withdrawAmount">
                                                                    <small>Montant à retirer</small>
                                                                </label>
                                                            </div>
                                                            <div className="col-7">
                                                                <input
                                                                    type="number"
                                                                    placeholder="$"
                                                                    className="form-control"
                                                                    id="withdrawAmount"
                                                                    name="withdrawAmount"
                                                                />
                                                            </div>
                                                            <div className="col-2 text-center">
                                                                <button
                                                                    className="btn"
                                                                    style={{
                                                                        backgroundColor: '#28a745',
                                                                        color: 'white',
                                                                    }}
                                                                    id="initiateWithdraw"
                                                                >
                                                                    Retrait
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div
                                className="tab-pane fade"
                                id="bankingDeposit"
                                role="tabpanel"
                                aria-labelledby="bankingDeposit-tab"
                            >
                                <div
                                    className="container-fluid p-2"
                                    style={{
                                        position: 'relative',
                                        top: 54,
                                    }}
                                >
                                    <div className="row">
                                        <div className="col-12 title">
                                            <h3
                                                style={{
                                                    fontSize: 35,
                                                }}
                                            >
                                                Dépôt
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div
                                            className="col-12"
                                            style={{
                                                fontSize: 12,
                                                color: 'white',
                                            }}
                                        >
                                            Déposez de l'argent sur votre compte bancaire.
                                        </div>
                                    </div>
                                    <div
                                        className="row"
                                        style={{
                                            position: 'relative',
                                            top: 20,
                                        }}
                                    >
                                        <div className="col-6">
                                            <div
                                                className="card mb-3"
                                                style={{
                                                    color: 'white',
                                                }}
                                            >
                                                <div className="card-header">
                                                    <i className="fad fa-fw fa-money-bill-wave" /> Solde bancaire actuel
                                                </div>
                                                <div className="card-body">
                                                    <h5
                                                        className="card-title"
                                                        style={{
                                                            fontWeight: 'bolder',
                                                            color: '#28a745',
                                                        }}
                                                        id="currentBalance2"
                                                    />
                                                    <p
                                                        className="card-text"
                                                        style={{
                                                            color: 'white',
                                                        }}
                                                    >
                                                        Montant total disponible pour retrait/transfert
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div
                                                className="card mb-3"
                                                style={{
                                                    color: 'white',
                                                }}
                                            >
                                                <div className="card-header">
                                                    <i className="fad fa-fw fa-coin" /> Argent actuel
                                                </div>
                                                <div className="card-body">
                                                    <h5
                                                        className="card-title"
                                                        style={{
                                                            fontWeight: 'bolder',
                                                            color: '#28a745',
                                                        }}
                                                        id="currentCashBalance2"
                                                    />
                                                    <p
                                                        className="card-text"
                                                        style={{
                                                            color: 'white',
                                                        }}
                                                    >
                                                        Montant total disponible pour le dépôt
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className="row"
                                        style={{
                                            position: 'relative',
                                            top: 20,
                                        }}
                                    >
                                        <div className="col-12">
                                            <div
                                                className="card mb-3"
                                                style={{
                                                    color: 'white',
                                                }}
                                            >
                                                <div className="card-body">
                                                    <div className="container-fluid">
                                                        <div
                                                            className="row"
                                                            id="depositError"
                                                            style={{
                                                                display: 'none',
                                                            }}
                                                        >
                                                            <div className="col-12">
                                                                <div
                                                                    className="alert alert-danger"
                                                                    role="alert"
                                                                    id="depositErrorMsg"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="row mt-2">
                                                            <div
                                                                className="col-3 my-auto"
                                                                style={{
                                                                    fontSize: 19,
                                                                    color: 'white',
                                                                }}
                                                            >
                                                                <label htmlFor="depositAmount">
                                                                    <small>Montant à déposer</small>
                                                                </label>
                                                            </div>
                                                            <div className="col-7">
                                                                <input
                                                                    type="number"
                                                                    placeholder="$"
                                                                    className="form-control"
                                                                    id="depositAmount"
                                                                    name="depositAmount"
                                                                />
                                                            </div>
                                                            <div className="col-2 text-center">
                                                                <button
                                                                    className="btn"
                                                                    style={{
                                                                        backgroundColor: '#28a745',
                                                                        color: 'white',
                                                                    }}
                                                                    id="initiateDeposit"
                                                                >
                                                                    Dépôt
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div
                                className="tab-pane fade"
                                id="bankingTransfer"
                                role="tabpanel"
                                aria-labelledby="bankingTransfer-tab"
                            >
                                <div
                                    className="container-fluid p-2"
                                    style={{
                                        position: 'relative',
                                        top: 54,
                                    }}
                                >
                                    <div className="row">
                                        <div className="col-12 title">
                                            <h3
                                                style={{
                                                    fontSize: 35,
                                                }}
                                            >
                                                Transfert
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div
                                            className="col-12"
                                            style={{
                                                fontSize: 12,
                                                color: 'white',
                                            }}
                                        >
                                            Transférez de l'argent vers un autre compte en saisissant simplement le
                                            numéro dédié de ce compte et le montant à transférer.
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div
                                            className="col-12"
                                            style={{
                                                position: 'relative',
                                                top: 20,
                                            }}
                                        >
                                            <div
                                                className="card mb-3"
                                                style={{
                                                    color: 'white',
                                                }}
                                            >
                                                <div className="card-body">
                                                    <div className="container-fluid">
                                                        <div
                                                            className="row"
                                                            id="transferError"
                                                            style={{
                                                                display: 'none',
                                                            }}
                                                        >
                                                            <div className="col-12">
                                                                <div
                                                                    className="alert alert-danger"
                                                                    role="alert"
                                                                    id="transferErrorMsg"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="row">
                                                            <div className="col-12">
                                                                {}
                                                                <div className="container-fluid">
                                                                    <div className="row m-1">
                                                                        <div
                                                                            className="col-3 my-auto"
                                                                            style={{
                                                                                fontSize: 19,
                                                                                color: 'white',
                                                                            }}
                                                                        >
                                                                            <label htmlFor="transferAcctNo">
                                                                                <small>Numéro de compte</small>
                                                                            </label>
                                                                        </div>
                                                                        <div className="col-9">
                                                                            <input
                                                                                type="text"
                                                                                id="transferAcctNo"
                                                                                name="transferAcctNo"
                                                                                className="form-control"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="row m-1">
                                                                        <div
                                                                            className="col-3 my-auto"
                                                                            style={{
                                                                                fontSize: 19,
                                                                                color: 'white',
                                                                            }}
                                                                        >
                                                                            <label htmlFor="transferAmount">
                                                                                <small>Montant à transférer</small>
                                                                            </label>
                                                                        </div>
                                                                        <div className="col-9">
                                                                            <input
                                                                                type="number"
                                                                                id="transferAmount"
                                                                                name="transferAmount"
                                                                                className="form-control"
                                                                                placeholder="$"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div
                                            className="col-12 text-center"
                                            style={{
                                                position: 'relative',
                                                top: 20,
                                            }}
                                        >
                                            <button
                                                className="btn"
                                                id="initiateTransfer"
                                                style={{
                                                    backgroundColor: '#28a745',
                                                    color: 'white',
                                                }}
                                            >
                                                Transférer
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div
                                className="tab-pane fade"
                                id="bankingOffShore"
                                role="tabpanel"
                                aria-labelledby="bankingSavings-tab"
                            >
                                <div
                                    className="container-fluid p-2"
                                    style={{
                                        position: 'relative',
                                        top: 54,
                                    }}
                                >
                                    <div className="row">
                                        <div className="col-12 title">
                                            <h4
                                                style={{
                                                    fontSize: 35,
                                                }}
                                            >
                                                Compte OffShore
                                            </h4>
                                        </div>
                                    </div>
                                    <div
                                        className="row"
                                        style={{
                                            position: 'relative',
                                            top: 20,
                                        }}
                                    >
                                        <div
                                            className="col-4"
                                            style={{
                                                color: '#00af17',
                                            }}
                                        >
                                            <div
                                                className="card mb-3"
                                                style={{
                                                    color: 'white',
                                                    minHeight: 150,
                                                }}
                                            >
                                                <div className="card-header">
                                                    <i className="fad fa-fw fa-money-bill-wave" /> Montant total du
                                                    compte
                                                </div>
                                                <div className="card-body text-center">
                                                    <h5 className="card-title">
                                                        <span id="offshoreBalance" />
                                                    </h5>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-8">
                                            <div
                                                className="card mb-3"
                                                style={{
                                                    color: 'white',
                                                }}
                                            >
                                                <div className="card-header">Action sur le compte</div>
                                                <div className="card-body">
                                                    <div className="container-fluid">
                                                        <div className="row">
                                                            <div className="col-8">
                                                                <label htmlFor="OffShoreTAmount">
                                                                    <small>Montant</small>
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    id="OffShoreTAmount"
                                                                    name="OffShoreTAmount"
                                                                    className="form-control"
                                                                    placeholder="$"
                                                                    style={{
                                                                        fontSize: 13,
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="col-4 align-self-end">
                                                                <button
                                                                    className="btn btn-block align-bottom"
                                                                    id="makeOffShoreTransfer"
                                                                    style={{
                                                                        backgroundColor: '#28a745',
                                                                        fontSize: 12,
                                                                        color: 'white',
                                                                    }}
                                                                >
                                                                    Déposer
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div
                                className="tab-pane fade"
                                id="bankingActions"
                                role="tabpanel"
                                aria-labelledby="bankingActions-tab"
                                style={{
                                    position: 'relative',
                                    top: 54,
                                }}
                            >
                                <div className="container-fluid p-2">
                                    <div className="row">
                                        <div className="col-12 title">
                                            <h3
                                                style={{
                                                    fontSize: 35,
                                                }}
                                            >
                                                Option du compte
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-12">
                                            <div
                                                className="card mb-3"
                                                style={{
                                                    color: 'white',
                                                }}
                                            >
                                                <div className="card-header">Compte Offshore</div>
                                                <div className="card-body">
                                                    <div className="container-fluid">
                                                        <div className="row">
                                                            <div
                                                                className="col-12 content"
                                                                style={{
                                                                    fontSize: 16,
                                                                }}
                                                            >
                                                                <p>
                                                                    Via ce menu vous pouvez ouvrir un compte Offshore,
                                                                    qui va vous permettre de blanchir de l'argent.
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="row">
                                                            <div className="col-12">
                                                                <button
                                                                    className="btn btn-block mt-2"
                                                                    style={{
                                                                        background: '#28a745',
                                                                        color: 'white',
                                                                    }}
                                                                    id="openOffshore"
                                                                >
                                                                    Ouvrir un compte Offshore
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MemoryRouter>
    );*/
};

import cn from 'classnames';
import { FunctionComponent, useState } from 'react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';

import { NuiEvent } from '../../../shared/event';
import { BankData } from '../../../shared/nui/bank';
import { groupDigits } from '../../../shared/utils/number';
import { fetchNui } from '../../fetch';
import { useBackspace } from '../../hook/control';
import { useNuiEvent, useNuiFocus } from '../../hook/nui';
import { useOutside } from '../../hook/outside';

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
                            <h3 style={{ fontSize: '35px' }}>Bienvenue, {bank.information.playerName}</h3>
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
                                        {groupDigits(bank.information.bankBalance)}$
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
                                        {groupDigits(bank.information.playerMoney)}$
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

    useNuiFocus(bankData !== null, bankData !== null, false);
    useNuiEvent('bank', 'open', setBankData);
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
                                        {!playerAccountReg.test(bankData.information.accountInfo) && (
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
                                        {playerAccountReg.test(bankData.information.accountInfo) && (
                                            <div
                                                id="accountNumberCard"
                                                className="card mb-3"
                                                style={{ color: 'white' }}
                                            >
                                                <div className="card-header">Identifiant du compte</div>
                                                <div className="card-body">
                                                    <p className="card-text" style={{ color: 'white' }}>
                                                        <span id="accountNumber">
                                                            {bankData.information.accountInfo}
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
};

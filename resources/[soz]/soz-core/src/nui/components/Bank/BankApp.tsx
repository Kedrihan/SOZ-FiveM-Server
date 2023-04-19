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
            <div className="w-full h-full grid h-screen place-items-center">
                <div
                    style={{
                        backgroundImage: `url(/public/images/vehicle/repair_app.png)`,
                        height: '720px',
                        width: '1280px',
                    }}
                    className="font-mono font-thin tracking-tight text-lg relative bg-contain bg-no-repeat"
                >
                    <div
                        style={{
                            width: '480px',
                            height: '470px',
                            top: '130px',
                            left: '133px',
                        }}
                        className="p-2 text-white absolute flex flex-col justify-between"
                    >
                        <div>
                            <Routes>
                                <Route path="/" element={<HomeTab bank={bankData} />} />
                                <Route path="/withdraw" element={<WithdrawTab bank={bankData} />} />
                                <Route path="/deposit" element={<DepositTab bank={bankData} />} />
                                <Route path="/transfer" element={<TransferTab bank={bankData} />} />
                                <Route path="/offshore" element={<OffshoreTab bank={bankData} />} />
                                <Route path="/actions" element={<ActionsTab bank={bankData} />} />
                            </Routes>
                        </div>
                        <a href="#" onClick={() => setBankData(null)} className="hover:underline text-white text-lg">
                            Quitter
                        </a>
                    </div>
                    <div>
                        <Link
                            style={{
                                top: '247px',
                                left: '659px',
                                width: '100px',
                            }}
                            to="/engine"
                        >
                            <span>Moteur</span>
                        </Link>
                        <Link
                            style={{
                                top: '482px',
                                left: '721px',
                                width: '100px',
                            }}
                            to="/wheel"
                        >
                            <span>Roues</span>
                        </Link>
                        <Link
                            style={{
                                top: '173px',
                                left: '814px',
                                width: '100px',
                            }}
                            to="/door"
                        >
                            <span>Portières</span>
                        </Link>
                        <Link
                            style={{
                                top: '491px',
                                left: '901px',
                                width: '100px',
                            }}
                            to="/body"
                        >
                            <span>Carrosserie</span>
                        </Link>
                        <Link
                            style={{
                                top: '173px',
                                left: '1000px',
                                width: '100px',
                            }}
                            to="/window"
                        >
                            <span>Vitres</span>
                        </Link>
                        <Link
                            style={{
                                top: '421px',
                                left: '1014px',
                                width: '100px',
                            }}
                            to="/tank"
                        >
                            <span>Réservoir</span>
                        </Link>
                    </div>
                </div>
            </div>
        </MemoryRouter>
    );
};

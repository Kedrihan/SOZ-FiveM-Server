import { FunctionComponent } from 'react';

import { NuiEvent } from '../../../shared/event';
import { MenuType } from '../../../shared/nui/menu';
import { fetchNui } from '../../fetch';
import {
    MainMenu,
    Menu,
    MenuContent,
    MenuItemButton,
    MenuItemSubMenuLink,
    MenuTitle,
    SubMenu,
} from '../Styleguide/Menu';

type SafeMenuProps = {
    safeStorage: string;
    money: number;
    marked_money: number;
    max?: number;
};

const banner = "https://nui-img/soz/menu_garage_personal"
const money_types = ['money', 'marked_money']
const deposit = (safe: string, money_type: 'money' | 'marked_money') => {
    fetchNui(NuiEvent.SafeDeposit, { safeStorage: safe, money_type: money_type });
};

const depositAll = (safe: string, money_type: 'money' | 'marked_money') => {
    fetchNui(NuiEvent.SafeDepositAll, { safeStorage: safe, money_type: money_type });
};

const withdraw = (safe: string, money_type: 'money' | 'marked_money') => {
    fetchNui(NuiEvent.SafeWithdraw, { safeStorage: safe, money_type: money_type });
};
export const SafeMenu: FunctionComponent<SafeMenuProps> = ({ safeStorage, money, marked_money }) => {
    return (
        <Menu type={MenuType.SafeMenu}>
            <MainMenu>
                <MenuTitle banner={banner}></MenuTitle>
                <MenuContent>
                    <MenuItemSubMenuLink id="money">Gestion de l'argent ({money}$)</MenuItemSubMenuLink>
                    <MenuItemSubMenuLink id="marked_money">Gestion de l'argent marqué ({marked_money}$)</MenuItemSubMenuLink>

                </MenuContent>
            </MainMenu>
            {money_types.map((money_type: 'money' | 'marked_money') => {
                return (
                    <SubMenu id={money_type}>
                        <MenuTitle banner={banner}>Gestion de l'argent {money_type == 'money' ? '(' + money + '$)' : ' marqué (' + marked_money + '$)'}</MenuTitle>
                        <MenuContent>
                            <MenuItemButton onConfirm={() => deposit(safeStorage, money_type)}>
                                Déposer
                            </MenuItemButton>
                            <MenuItemButton onConfirm={() => depositAll(safeStorage, money_type)}>
                                Tout déposer
                            </MenuItemButton>
                            <MenuItemButton onConfirm={() => withdraw(safeStorage, money_type)}>
                                Retirer
                            </MenuItemButton>
                        </MenuContent>
                    </SubMenu>
                )
            })
            }
        </Menu >
    );
};

export const SafeHouseMenu: FunctionComponent<SafeMenuProps> = ({ safeStorage, marked_money, max }) => {
    return (
        <Menu type={MenuType.SafeMenu}>
            <MainMenu>
                <MenuTitle banner={banner}></MenuTitle>
                <MenuContent>
                    <MenuItemSubMenuLink id="marked_money">Gestion de l'argent marqué ({marked_money}$)</MenuItemSubMenuLink>
                </MenuContent>
            </MainMenu>
            <SubMenu id="marked_money">
                <MenuTitle banner={banner}>Argent marqué {marked_money}/{max}</MenuTitle>
                <MenuContent>
                    <MenuItemButton onConfirm={() => deposit(safeStorage, 'marked_money')}>
                        Déposer
                    </MenuItemButton>
                    <MenuItemButton onConfirm={() => depositAll(safeStorage, 'marked_money')}>
                        Tout déposer
                    </MenuItemButton>
                    <MenuItemButton onConfirm={() => withdraw(safeStorage, 'marked_money')}>
                        Retirer
                    </MenuItemButton>
                </MenuContent>
            </SubMenu>
        </Menu >
    );
};
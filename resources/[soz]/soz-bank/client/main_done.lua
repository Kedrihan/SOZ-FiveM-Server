QBCore = exports["qb-core"]:GetCoreObject()
SozJobCore = exports["soz-jobs"]:GetCoreObject()
PlayerData = QBCore.Functions.GetPlayerData()
local safeStorageMenu = MenuV:CreateMenu(nil, "", "menu_inv_safe", "soz", "safe-storage")
local safeHouseStorageMenu = MenuV:CreateMenu(nil, "", "menu_inventory", "soz", "safe-house-storage")
local isInsideEntrepriseBankZone = false

local currentBank = {}
exports("GetCurrentBank", function()
    return currentBank
end)

RegisterNetEvent("banking:client:displayAtmBlips", function(newAtmCoords)
    for atmAccount, coords in pairs(newAtmCoords) do
        CreateAtmBlip(atmAccount, coords)
    end
end)

local function SafeStorageDeposit(money_type, safeStorage)
    local amount = exports["soz-hud"]:Input("Quantité", 12)

    if amount and tonumber(amount) > 0 then
        TriggerServerEvent("banking:server:SafeStorageDeposit", money_type, safeStorage, tonumber(amount))
    end
end

local function SafeStorageDepositAll(money_type, safeStorage)
    if PlayerData.money[money_type] and PlayerData.money[money_type] > 0 then
        TriggerServerEvent("banking:server:SafeStorageDeposit", money_type, safeStorage, PlayerData.money[money_type])
    end
end

local function SafeStorageWithdraw(money_type, safeStorage)
    local amount = exports["soz-hud"]:Input("Quantité", 12)

    if amount and tonumber(amount) > 0 then
        TriggerServerEvent("banking:server:SafeStorageWithdraw", money_type, safeStorage, tonumber(amount))
    end
end

local function OpenSafeStorageMenu(safeStorage, money, black_money)
    safeStorageMenu:ClearItems()

    local moneyMenu = MenuV:InheritMenu(safeStorageMenu, {subtitle = ("Gestion de l'argent (%s$)"):format(money)})
    local moneyDeposit = moneyMenu:AddButton({label = "Déposer"})
    local moneyDepositAll = moneyMenu:AddButton({label = "Tout déposer"})
    local moneyWithdraw = moneyMenu:AddButton({label = "Retirer"})

    moneyDeposit:On("select", function()
        SafeStorageDeposit("money", safeStorage)
        MenuV:CloseAll()
    end)
    moneyDepositAll:On("select", function()
        SafeStorageDepositAll("money", safeStorage)
        MenuV:CloseAll()
    end)
    moneyWithdraw:On("select", function()
        SafeStorageWithdraw("money", safeStorage)
        MenuV:CloseAll()
    end)

    local markedMoneyMenu = MenuV:InheritMenu(safeStorageMenu,
                                              {subtitle = ("Gestion de l'argent marqué (%s$)"):format(black_money)})
    local markedMoneyDeposit = markedMoneyMenu:AddButton({label = "Déposer"})
    local markedMoneyDepositAll = markedMoneyMenu:AddButton({label = "Tout déposer"})
    local markedMoneyWithdraw = markedMoneyMenu:AddButton({label = "Retirer"})

    markedMoneyDeposit:On("select", function()
        SafeStorageDeposit("marked_money", safeStorage)
        MenuV:CloseAll()
    end)
    markedMoneyDepositAll:On("select", function()
        SafeStorageDepositAll("marked_money", safeStorage)
        MenuV:CloseAll()
    end)
    markedMoneyWithdraw:On("select", function()
        SafeStorageWithdraw("marked_money", safeStorage)
        MenuV:CloseAll()
    end)

    safeStorageMenu:AddButton({label = "Argent", value = moneyMenu, rightLabel = "~g~" .. money .. "$"})
    safeStorageMenu:AddButton({
        label = "Argent Marqué",
        value = markedMoneyMenu,
        rightLabel = "~r~" .. black_money .. "$",
    })

    safeStorageMenu:Open()
end

local function OpenHouseSafeStorageMenu(safeStorage, money, black_money, maxSafeWeight)
    safeHouseStorageMenu:ClearItems()

    local markedMoneyMenu = MenuV:InheritMenu(safeHouseStorageMenu,
                                              {subtitle = ("Gestion de l'argent marqué ($%s)"):format(black_money)})
    local markedMoneyDeposit = markedMoneyMenu:AddButton({label = "Déposer"})
    local markedMoneyDepositAll = markedMoneyMenu:AddButton({label = "Tout déposer"})
    local markedMoneyWithdraw = markedMoneyMenu:AddButton({label = "Retirer"})

    markedMoneyDeposit:On("select", function()
        SafeStorageDeposit("marked_money", safeStorage)
        MenuV:CloseAll()
    end)
    markedMoneyDepositAll:On("select", function()
        SafeStorageDepositAll("marked_money", safeStorage)
        MenuV:CloseAll()
    end)
    markedMoneyWithdraw:On("select", function()
        SafeStorageWithdraw("marked_money", safeStorage)
        MenuV:CloseAll()
    end)

    safeHouseStorageMenu:AddButton({
        label = "Argent Marqué",
        value = markedMoneyMenu,
        rightLabel = "~r~$" .. black_money .. "/$" .. maxSafeWeight,
    })

    safeHouseStorageMenu:Open()
end

RegisterNetEvent("banking:client:openHouseSafe", function(houseid)
    QBCore.Functions.TriggerCallback("banking:server:openHouseSafeStorage",
                                     function(isAllowed, money, black_money, max)
        if isAllowed then
            OpenHouseSafeStorageMenu(houseid, money, black_money, max)
        else
            exports["soz-hud"]:DrawNotification("Vous n'avez pas accès à ce coffre", "error")
        end
    end, houseid)
end)

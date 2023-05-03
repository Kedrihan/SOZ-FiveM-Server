Citizen.CreateThread(function()
    while true do
        if GlobalState.blackout_level < 4 and GlobalState.blackout == false then
            local processingItems = exports["soz-inventory"]:GetAllItems(GarbageConfig.Processing.ProcessingStorage)

            if #processingItems > 0 then
                local remainingItemToProcess = GarbageConfig.Processing.ProcessingAmount

                for _, item in pairs(processingItems) do
                    if remainingItemToProcess > 0 then
                        local itemAmount = item.amount

                        if itemAmount > remainingItemToProcess then
                            itemAmount = remainingItemToProcess
                        end

                        remainingItemToProcess = remainingItemToProcess - itemAmount

                        if exports["soz-inventory"]:RemoveItem(GarbageConfig.Processing.ProcessingStorage,
                                                               item.item.name, itemAmount) then
                            local resellPrice = GarbageConfig.SellPrice[item.item.name] or
                                                    GarbageConfig.SellPrice["default"]

                            TriggerEvent("soz-core:server:bank:transferMoney", "farm_garbage", "safe_garbage",
                                         itemAmount * resellPrice)
                            TriggerEvent("monitor:server:event", "job_bluebird_recycling_garbage_bag",
                                         {item = item.item.name}, {quantity = tonumber(itemAmount)})
                        end

                    end
                end
            end
        end
        Citizen.Wait(GarbageConfig.Processing.Duration)
    end
end)

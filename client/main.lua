-- Variables
local QBCore = exports[Config.CoreName]:GetCoreObject()
local PlayerData = QBCore.Functions.GetPlayerData()
local inInventory = false
local currentWeapon = nil
local currentOtherInventory = nil
local Drops = {}
CurrentDrop = nil
local DropsNear = {}
local CurrentVehicle = nil
local CurrentGlovebox = nil
local CurrentStash = nil
local isCrafting = false
local isHotbar = false
local WeaponAttachments = {}
local showBlur = true

-- Functions
-- Change this to your Notification script if needed
function QBInventoryNotify(msg, type, length)
    if Framework == "QBCore" then
    	FWork.Functions.Notify(msg, type, length)
end
end

RegisterNetEvent("ls-inventory:client:notifier", function(msg, type, length)
	QBInventoryNotify(msg, type, length)
end)

local function HasItem(items, amount)
    local isTable = type(items) == 'table'
    local isArray = isTable and table.type(items) == 'array' or false
    local totalItems = #items
    local count = 0
    local kvIndex = 2
	if isTable and not isArray then
        totalItems = 0
        for _ in pairs(items) do totalItems += 1 end
        kvIndex = 1
    end
    for _, itemData in pairs(PlayerData.items) do
        if isTable then
            for k, v in pairs(items) do
                local itemKV = {k, v}
                if itemData and itemData.name == itemKV[kvIndex] and ((amount and itemData.amount >= amount) or (not isArray and itemData.amount >= v) or (not amount and isArray)) then
                    count += 1
                end
            end
            if count == totalItems then
                return true
            end
        else -- Single item as string
            if itemData and itemData.name == items and (not amount or (itemData and amount and itemData.amount >= amount)) then
                return true
            end
        end
    end
    return false
end

exports("HasItem", HasItem)

RegisterNUICallback('showBlur', function()
    Wait(50)
    TriggerEvent("qb-inventory:client:showBlur")
end) 
RegisterNetEvent("qb-inventory:client:showBlur", function()
    Wait(50)
    showBlur = not showBlur
end)

-- Functions

local function GetClosestVending()
    local ped = PlayerPedId()
    local pos = GetEntityCoords(ped)
    local object = nil
    for _, machine in pairs(Config.VendingObjects) do
        local ClosestObject = GetClosestObjectOfType(pos.x, pos.y, pos.z, 0.75, GetHashKey(machine), 0, 0, 0)
        if ClosestObject ~= 0 then
            if object == nil then
                object = ClosestObject
            end
        end
    end
    return object
end

local function OpenVending()
    local ShopItems = {}
    ShopItems.label = "Vending Machine"
    ShopItems.items = Config.VendingItem
    ShopItems.slots = #Config.VendingItem
    TriggerServerEvent("inventory:server:OpenInventory", "shop", "Vendingshop_"..math.random(1, 99), ShopItems)
end

local function DrawText3Ds(x, y, z, text)
	SetTextScale(0.35, 0.35)
    SetTextFont(4)
    SetTextProportional(1)
    SetTextColour(255, 255, 255, 215)
    SetTextEntry("STRING")
    SetTextCentre(true)
    AddTextComponentString(text)
    SetDrawOrigin(x,y,z, 0)
    DrawText(0.0, 0.0)
    local factor = (string.len(text)) / 370
    DrawRect(0.0, 0.0+0.0125, 0.017+ factor, 0.03, 0, 0, 0, 75)
    ClearDrawOrigin()
end

local function LoadAnimDict(dict)
    if HasAnimDictLoaded(dict) then return end

    RequestAnimDict(dict)
    while not HasAnimDictLoaded(dict) do
        Wait(10)
    end
end

local function FormatWeaponAttachments(itemdata)
    local attachments = {}
    itemdata.name = itemdata.name:upper()
    if itemdata.info.attachments ~= nil and next(itemdata.info.attachments) ~= nil then
        for _, v in pairs(itemdata.info.attachments) do
            attachments[#attachments+1] = {
                attachment = v.item,
                label = v.label,
                image = QBCore.Shared.Items[v.item].image,
                component = v.component
            }
        end
    end
    return attachments
end

local function IsBackEngine(vehModel)
    return BackEngineVehicles[vehModel]
end


local function OpenTrunk()
    local vehicle = QBCore.Functions.GetClosestVehicle()
    LoadAnimDict("amb@prop_human_bum_bin@idle_b")
    TaskPlayAnim(PlayerPedId(), "amb@prop_human_bum_bin@idle_b", "idle_d", 4.0, 4.0, -1, 50, 0, false, false, false)
    if IsBackEngine(GetEntityModel(vehicle)) then
        SetVehicleDoorOpen(vehicle, 4, false, false)
    else
        SetVehicleDoorOpen(vehicle, 5, false, false)
    end
end

---Closes the trunk of the closest vehicle
local function CloseTrunk()
    local vehicle = QBCore.Functions.GetClosestVehicle()
    LoadAnimDict("amb@prop_human_bum_bin@idle_b")
    TaskPlayAnim(PlayerPedId(), "amb@prop_human_bum_bin@idle_b", "exit", 4.0, 4.0, -1, 50, 0, false, false, false)
    if IsBackEngine(GetEntityModel(vehicle)) then
        SetVehicleDoorShut(vehicle, 4, false)
    else
        SetVehicleDoorShut(vehicle, 5, false)
    end
end

---Closes the inventory NUI
local function closeInventory()
    SendNUIMessage({
        action = "close",
    })
end

local function ToggleHotbar(toggle)
    local HotbarItems = {
        [1] = PlayerData.items[1],
        [2] = PlayerData.items[2],
        [3] = PlayerData.items[3],
        [4] = PlayerData.items[4],
        [5] = PlayerData.items[5],
        [41] = PlayerData.items[41],
    }

    SendNUIMessage({
        action = "toggleHotbar",
        open = toggle,
        items = HotbarItems
    })
end


local function openAnim()
    local ped = PlayerPedId()
    LoadAnimDict('pickup_object')
    TaskPlayAnim(ped,'pickup_object', 'putdown_low', 5.0, 1.5, 1.0, 48, 0.0, 0, 0, 0)
    Wait(500)
    StopAnimTask(ped, 'pickup_object', 'putdown_low', 1.0)
end

---Setup item info for items from Config.CraftingItems
local function ItemsToItemInfo()
	local item_count = 0
	for _, _ in pairs(Config.CraftingItems) do
		item_count = item_count + 1
	end

	local itemInfos = {}

	for i = 1, item_count do
		local ex_string = ""

		for key, value in pairs(Config.CraftingItems[i].costs) do
			ex_string = ex_string .. QBCore.Shared.Items[key]["label"] .. ": " .. value .. "x "
		end

		itemInfos[i] = { costs = ex_string }
	end

	local items = {}
	for _, item in pairs(Config.CraftingItems) do
		local itemInfo = QBCore.Shared.Items[item.name:lower()]
		items[item.slot] = {
			name = itemInfo["name"],
			amount = tonumber(item.amount),
			info = itemInfos[item.slot],
			label = itemInfo["label"],
			description = itemInfo["description"] or "",
			weight = itemInfo["weight"],
			type = itemInfo["type"],
			unique = itemInfo["unique"],
			useable = itemInfo["useable"],
			image = itemInfo["image"],
			slot = item.slot,
			costs = item.costs,
			threshold = item.threshold,
			points = item.points,
		}
	end
	Config.CraftingItems = items
end

---Setup item info for items from Config.AttachmentCrafting["items"]
local function SetupAttachmentItemsInfo()
	local item_count = 0
	for _, _ in pairs(Config.AttachmentCrafting) do
		item_count = item_count + 1
	end

	local itemInfos = {}

	for i = 1, item_count do
		local ex_string = ""

		for key, value in pairs(Config.AttachmentCrafting[i].costs) do
			ex_string = ex_string .. QBCore.Shared.Items[key]["label"] .. ": " .. value .. "x "
		end

		itemInfos[i] = { costs = ex_string }
	end

	local items = {}
	for _, item in pairs(Config.AttachmentCrafting) do
		local itemInfo = QBCore.Shared.Items[item.name:lower()]
		items[item.slot] = {
			name = itemInfo["name"],
			amount = tonumber(item.amount),
			info = itemInfos[item.slot],
			label = itemInfo["label"],
			description = itemInfo["description"] or "",
			weight = itemInfo["weight"],
			unique = itemInfo["unique"],
			useable = itemInfo["useable"],
			image = itemInfo["image"],
			slot = item.slot,
			costs = item.costs,
			threshold = item.threshold,
			points = item.points,
		}
	end
	Config.AttachmentCrafting = items
end

---Runs ItemsToItemInfo() and checks if the client has enough reputation to support the threshold, otherwise the items is not available to craft for the client
---@return table items
local function GetThresholdItems()
	ItemsToItemInfo()
	local items = {}
	for k in pairs(Config.CraftingItems) do
		if PlayerData.metadata["craftingrep"] >= Config.CraftingItems[k].threshold then
			items[k] = Config.CraftingItems[k]
		end
	end
	return items
end

---Runs SetupAttachmentItemsInfo() and checks if the client has enough reputation to support the threshold, otherwise the items is not available to craft for the client
---@return table items
local function GetAttachmentThresholdItems()
	SetupAttachmentItemsInfo()
	local items = {}
	for k in pairs(Config.AttachmentCrafting) do
		if PlayerData.metadata["attachmentcraftingrep"] >= Config.AttachmentCrafting[k].threshold then
			items[k] = Config.AttachmentCrafting[k]
		end
	end
	return items
end

local function RemoveNearbyDrop(index)
    if not DropsNear[index] then return end

    local dropItem = DropsNear[index].object
    if DoesEntityExist(dropItem) then
        DeleteEntity(dropItem)
    end

    DropsNear[index] = nil

    if not Drops[index] then return end

    Drops[index].object = nil
    Drops[index].isDropShowing = nil
end

---Removes all drops in the area of the client
local function RemoveAllNearbyDrops()
    for k in pairs(DropsNear) do
        RemoveNearbyDrop(k)
    end
end

--ITEM DROP

--VENDING

if Config.VendingMachine == true then

CreateThread(function()
    if Config.TargetSystem == "qb_target" then
        exports['qb-target']:AddTargetModel(Config.VendingObjects, {
            options = {
                {
                    icon = 'fa-solid fa-cash-register',
                    label = 'Open Vending',
                    action = function()
                        OpenVending()
                    end
                },
            },
            distance = 2.5
        })
    elseif Config.TargetSystem == "customtarget" then
        exports[Config.CustomTarget]:AddTargetModel(Config.VendingObjects, {
            options = {
                {
                    icon = 'fa-solid fa-cash-register',
                    label = 'Open Vending',
                    action = function()
                        OpenVending()
                    end
                },
            },
            distance = 2.5
        })
    elseif Config.TargetSystem == "ox_target" then
        exports.ox_target:addModel(Config.VendingObjects, {
            {
                icon = 'fa-solid fa-cash-register',
                label = 'Open Vending',
                onSelect = function()
                    OpenVending()
                end
            },
        })
    elseif Config.TargetSystem == "interact" then
            local vendingobjects = { -- The mighty list of vending machines
            `prop_vend_soda_01`,
            `prop_vend_soda_02`,
            `prop_vend_water_01`
            }
        
            for i = 1, #vendingobjects do
            exports.interact:AddModelInteraction({
                model = vendingobjects[i],
                offset = vec3(0.0, 0.0, 0.0), -- optional
                -- bone = 'engine', -- optional
                -- name = 'interactionName', -- optional
                id = 'vending_', -- needed for removing interactions
                distance = 4.0, -- optional
                interactDst = 1.5, -- optional
                ignoreLos = true,
                options = {
                    {
                        icon = 'fa-solid fa-cash-register',
                        label = 'Open Vending',
                        action = function()
                            OpenVending()
                        end
                    },
                },
            })
        end
    end
end)
end

--BIN

-- Events

RegisterNetEvent('QBCore:Client:OnPlayerLoaded', function()
    LocalPlayer.state:set("inv_busy", false, true)
    PlayerData = QBCore.Functions.GetPlayerData()
    QBCore.Functions.TriggerCallback("inventory:server:GetCurrentDrops", function(theDrops)
		Drops = theDrops
    end)
end)

RegisterNetEvent('QBCore:Client:OnPlayerUnload', function()
    LocalPlayer.state:set("inv_busy", true, true)
    PlayerData = {}
    RemoveAllNearbyDrops()
end)

RegisterNetEvent('QBCore:Client:UpdateObject', function()
    QBCore = exports['qb-core']:GetCoreObject()
end)

RegisterNetEvent('QBCore:Player:SetPlayerData', function(val)
    PlayerData = val
end)

AddEventHandler('onResourceStop', function(name)
    if name ~= GetCurrentResourceName() then return end
    if Config.UseItemDrop then RemoveAllNearbyDrops() end
end)

RegisterNetEvent('inventory:client:CheckOpenState', function(type, id, label)
    local name = QBCore.Shared.SplitStr(label, "-")[2]
    if type == "stash" then
        if name ~= CurrentStash or CurrentStash == nil then
            TriggerServerEvent('inventory:server:SetIsOpenState', false, type, id)
        end
    elseif type == "trunk" then
        if name ~= CurrentVehicle or CurrentVehicle == nil then
            TriggerServerEvent('inventory:server:SetIsOpenState', false, type, id)
        end
    elseif type == "glovebox" then
        if name ~= CurrentGlovebox or CurrentGlovebox == nil then
            TriggerServerEvent('inventory:server:SetIsOpenState', false, type, id)
        end
    elseif type == "drop" then
        if name ~= CurrentDrop or CurrentDrop == nil then
            TriggerServerEvent('inventory:server:SetIsOpenState', false, type, id)
        end
    end
end)

RegisterNetEvent('inventory:client:ItemBox', function(itemData, type, amount)
    amount = amount or 1
    SendNUIMessage({
        action = "itemBox",
        item = itemData,
        type = type,
        itemAmount = amount
    })
end)

RegisterNetEvent('inventory:client:requiredItems', function(items, bool)
    local itemTable = {}
    if bool then
        for k in pairs(items) do
            itemTable[#itemTable+1] = {
                item = items[k].name,
                label = QBCore.Shared.Items[items[k].name]["label"],
                image = items[k].image,
            }
        end
    end

    SendNUIMessage({
        action = "requiredItem",
        items = itemTable,
        toggle = bool
    })
end)

RegisterNetEvent('inventory:server:RobPlayer', function(TargetId)
    SendNUIMessage({
        action = "RobMoney",
        TargetId = TargetId,
    })
end)

-- Функция за изчисляване на проценти на наранявания на костите (спадат от 100% до 0%)
local function GetBodyDamagePercentages()
    local damagePercentages = {}

    for bone, data in pairs(Config.FirstData) do
        local health = data.health
        local initialHealth = 100
        local percentage = (health / initialHealth) * 100
        damagePercentages[bone] = {
            percent = math.max(percentage, 0)  -- гарантиране, че процентът не е отрицателен
        }
    end

    return damagePercentages
end

-- Експортиране на функцията
exports('GetBodyDamagePercentages', GetBodyDamagePercentages)

-- Събитие за отваряне на инвентар
RegisterNetEvent('inventory:client:OpenInventory', function(PlayerAmmo, inventory, other)
    TriggerEvent('qb-inventory:UpdatePlayerDamage')
    if not IsEntityDead(PlayerPedId()) then
        local rooms, room = nil, nil
        if Config.OrApartment == true then
            rooms = exports["0r-apartment"]:GetPlayerOwnedRooms()
            if next(rooms) then
                room = rooms[#rooms]
                room.apartment_label = exports["0r-apartment"]:GetApartmentLabelById(room.apartment_id)
            end
        end

        filterWeapon = {}
        for k, v in pairs(QBCore.Shared.Items) do
            if v.type == "weapon" then
                table.insert(filterWeapon, v.label)
            end
        end

        -- Вземете проценти на наранявания
		local invMenu1 = exports['ls-lib']:getInvMenu1()
		local getInvDamages = exports['ls-lib']:getInvDamages()
        local bodypercent = getInvDamages

        if Config.Progressbar.Enable then
            QBCore.Functions.Progressbar('open_inventory', 'Opening Inventory...', math.random(Config.Progressbar.minT, Config.Progressbar.maxT), false, true, { -- Name | Label | Time | useWhileDead | canCancel
                disableMovement = false,
                disableCarMovement = false,
                disableMouse = false,
                disableCombat = false,
            }, {}, {}, {}, function() -- Play When Done
                ToggleHotbar(false)
                SetNuiFocus(true, true)
                if other then
                    currentOtherInventory = other.name
                end
                QBCore.Functions.TriggerCallback(invMenu1, function(data)
                    inventory = data.inventory
                    other = data.other
                    SendNUIMessage({
                        action = "",
                        inventory = inventory,
                        slots = Config.MaxInventorySlots,
                        other = other,
                        maxweight = Config.MaxInventoryWeight,
                        Ammo = PlayerAmmo,
                        maxammo = Config.MaximumAmmoValues,
                        Name = PlayerData.charinfo.firstname .." ".. PlayerData.charinfo.lastname, 
    
                        pName = PlayerData.charinfo.firstname .." ".. PlayerData.charinfo.lastname,
                        pNumber = "" .. string.sub(PlayerData.charinfo.phone, 1, 3) .. "-" .. string.sub(PlayerData.charinfo.phone, 4, 6) .. "-" .. string.sub(PlayerData.charinfo.phone, 7),
                        pCID = PlayerData.citizenid,
                        pID = GetPlayerServerId(PlayerId()),
                        apartment = room,
                        weapons = filterWeapon,
                        filter = Config.Filter,
                        pHeadDamage = bodypercent['Head'] and bodypercent['Head'].percent or 0,
                        pBodyDamage = bodypercent['Chest'] and bodypercent['Chest'].percent or 0,
                        pRArmDamage = bodypercent['RArm'] and bodypercent['RArm'].percent or 0,
                        pLArmDamage = bodypercent['LArm'] and bodypercent['LArm'].percent or 0,
                        pRLegDamage = bodypercent['RKnee'] and bodypercent['RKnee'].percent or 0,
                        pLLegDamage = bodypercent['LKnee'] and bodypercent['LKnee'].percent or 0,
                    })
                    inInventory = true
                end, inventory, other)
            end)
        else
            Wait(Config.Waittime)
            ToggleHotbar(false)
            SetNuiFocus(true, true)
            if other then
                currentOtherInventory = other.name
            end
            QBCore.Functions.TriggerCallback(invMenu1, function(data)
                inventory = data.inventory
                other = data.other
                SendNUIMessage({
                    action = "open",
                    inventory = inventory,
                    slots = Config.MaxInventorySlots,
                    other = other,
                    maxweight = Config.MaxInventoryWeight,
                    Ammo = PlayerAmmo,
                    maxammo = Config.MaximumAmmoValues,
                    Name = PlayerData.charinfo.firstname .." ".. PlayerData.charinfo.lastname, 
    
                    pName = PlayerData.charinfo.firstname .." ".. PlayerData.charinfo.lastname,
                    pNumber = "" .. string.sub(PlayerData.charinfo.phone, 1, 3) .. "-" .. string.sub(PlayerData.charinfo.phone, 4, 6) .. "-" .. string.sub(PlayerData.charinfo.phone, 7),
                    pCID = PlayerData.citizenid,
                    pID = GetPlayerServerId(PlayerId()),
                    apartment = room,
                    weapons = filterWeapon,
                    filter = Config.Filter,
                    pHeadDamage = bodypercent['Head'] and bodypercent['Head'].percent or 0,
                    pBodyDamage = bodypercent['Chest'] and bodypercent['Chest'].percent or 0,
                    pRArmDamage = bodypercent['RArm'] and bodypercent['RArm'].percent or 0,
                    pLArmDamage = bodypercent['LArm'] and bodypercent['LArm'].percent or 0,
                    pRLegDamage = bodypercent['RKnee'] and bodypercent['RKnee'].percent or 0,
                    pLLegDamage = bodypercent['LKnee'] and bodypercent['LKnee'].percent or 0,
                })
                inInventory = true
            end, inventory, other)
        end
    end
end)

-- Функция за обработка на събития за наранявания
AddEventHandler('gameEventTriggered', function(event, data)
    if Config.ExperimentalFeatures == false then return end

    local count = 0
    local playerPed = PlayerPedId()
    
    if event == 'CEventNetworkEntityDamage' then
        local victim, attacker, victimDied, weapon = data[1], data[2], data[4], data[7]
       
        if not IsEntityAPed(victim) then return end
        if victimDied and NetworkGetPlayerIndexFromPed(victim) == PlayerId() then
            -- Проверка дали играчът има броня
            local playerArmor = GetPedArmour(playerPed)
            if playerArmor > 0 then
                return
            end

            local damage = { name = "nd", label = "Not detected!" ,count = 0}
            local playerid = NetworkGetPlayerIndexFromPed(victim)
            local killerId = NetworkGetPlayerIndexFromPed(attacker)

            victimid = NetworkGetPlayerIndexFromPed(victim)
            victimid = GetPlayerServerId(victimid)
      
            local weaponLabel = (Config.WeaponsExtra and Config.WeaponsExtra[weapon] and Config.WeaponsExtra[weapon].label) or 'Unknown'
            local weaponName = (Config.WeaponsExtra and Config.WeaponsExtra[weapon] and Config.WeaponsExtra[weapon].name) or 'Unknown'
            local weaponType = (Config.WeaponsExtra and Config.WeaponsExtra[weapon] and Config.WeaponsExtra[weapon].weapontype) or 'Unknown'
 
            if weaponName == "weapon_run_over_by_car" or weaponName == "weapon_rammed_by_car" then 
                damage = { name = weaponName, label = weaponLabel  ,count = count + 1}
            end

            if weaponName == "weapon_fall" then 
                damage = { name = weaponName, label = weaponLabel.." Damage" ,count = count + 1 }
            end

            if weaponType == "Melee" then  
                damage = { name = "knife", label = "Stabbed with knife" ,count = count + 1}
            end
            
            if weaponType == "Melee" and weaponName == "weapon_unarmed" then 
                  damage = { name = "weapon_unarmed", label = "Punch attack" , count = count + 1}
            end

            if damage.name == "nd" then 
                damage = { name = weaponName, label = weaponLabel ,count = count + 1}
            end
            
            if damage.name == "nd" then return end

            local FoundLastDamagedBone, LastDamagedBone = GetPedLastDamageBone(victim)
 
            TriggerEvent("boss-damage", victimid, damage, victim, LastDamagedBone)
        end
    end
end)

-- Функция за обработка на данни за наранявания
damageCount = 0
RegisterNetEvent("boss-damage")
AddEventHandler("boss-damage", function(victim, damage, victim_ped, LastDamagedBone)
    playerDamage = damage
    local alt = Config.GetAlternativeBone(LastDamagedBone)
    if alt ~= false and damage then 
        damage.bone = alt
        damageCount = damageCount + 1
        damage.count = damageCount
        
        for k,v in pairs(Config.PlayerBones) do 
            if v == alt then 
                -- Намаляване на здравето на костите
                Config.FirstData[k].health = Config.FirstData[k].health - Config.FirstData[k].damage
                Config.FirstData[k].severity = Config.FirstData[k].severity + 1
                
                if Config.FirstData[k].health <= 0 then 
                    Config.FirstData[k].health = 0
                    Config.FirstData[k].broken = true
                    Config.FirstData[k].bleeding = true
                else
                    Config.FirstData[k].broken = false
                    Config.FirstData[k].bleeding = false
                end

                if Config.FirstData[k].severity >= 3 then 
                    Config.FirstData[k].broken = true
                    Config.FirstData[k].bleeding = true
                end
            end
        end
    end
end)

-- Функция за възстановяване на здравето на костите до 100%
local function ResetBodyDamage()
    local playerPed = PlayerPedId()
    local maxHealth = 100  -- Максимално здраве на играча
    local playerHealth = GetEntityHealth(playerPed)  -- Текущото здраве на играча
    local healthPercentage = (playerHealth / maxHealth) * 100  -- Процентно здраве на играча

    -- Възстановяване на здравето на костите съобразно процента на здравето на играча
    for bone, data in pairs(Config.FirstData) do
        -- Проверете дали костта е в състояние на нараняване
        if data.health < 100 then
            -- Изчисляване на новото здраве на костите
            local currentBoneHealth = data.health
            local healthDelta = 100 - currentBoneHealth
            local newBoneHealth = currentBoneHealth + (healthDelta * (healthPercentage / 100) * 0.4)  -- 0.1 е фактор за темпото на възстановяване
            
            -- Уверете се, че новото здраве не надвишава максималното
            newBoneHealth = math.min(newBoneHealth, 100)

            -- Актуализиране на състоянието на костите
            data.health = newBoneHealth
            if newBoneHealth >= 100 then
                data.broken = false
                data.bleeding = false
                data.severity = 0
            end
        end
    end
end

-- Регистриране на функцията като експорт
exports('ResetBodyDamage', ResetBodyDamage)


-- Функция за възстановяване на здравето на костите до 100%
local function ResetAllBodyDamage()
    for bone, data in pairs(Config.FirstData) do
        Config.FirstData[bone].health = 100
        Config.FirstData[bone].broken = false
        Config.FirstData[bone].bleeding = false
        Config.FirstData[bone].severity = 0
    end
end

-- Регистриране на функцията като експорт
exports('ResetAllBodyDamage', ResetAllBodyDamage)


-- Конфигурационни данни
Config.PlayerBones = {
    ['RFoot'] = 52301,
    ['LFoot'] = 14201,
    ['RKnee'] = 36864,
    ['LKnee'] = 63931,
    ['Head'] = 31086,
    ['RArm'] = 28252,
    ['LArm'] = 61163,
    ['Chest'] = 24818,
}

Config.BoneGroups = {
    [52301] = {  -- RFoot
        20781,24806,52301
    },
    [14201] = {  -- LFoot
        2108,14201,35502,57717,65245
    },
    [36864] = {  -- RKnee
        16335,36864,51826
    },
    [63931] = {  -- LKnee
        23639,46078,58271,63931
    },
    [31086] = {  -- Head
        1356, 10706, 11174,12844,17188,17719,19336,20178,20279,20623,21550,25260,27474,29868,31086,35731,
        37193,39317,43536,45750,46240,47419,47495,49979,58331,61839,64729,65068
    },
    [28252] = {  -- RArm
        2992,6286,6442,26610,26611,26612,26613,26614,28252,28422,37119,
        40269,43810,57005, 
        58866,58867,58868,58869,58870,
        64016,64017,64064,64065,64080,64081,64096,64097,64112,64113
    },
    [61163] = {  -- LArm
        4089,4090,4137,4138,4153,4154,4169,4170,4185,4186,
        5232,18905,22711,36029,45509,60309,61007,61163
    },
    [24818] = {  -- Chest
        0, 11816,23553,24816,24817,24818,56604,57597
    }
}

Config.FirstData = {
    ["Chest"] = {
        bullets = 0,
        broken = false,
        bleeding = false,
        severity = 0,
        health = 100,
        damage = 10,
    },
    ["Head"] = {
        bullets = 0,
        broken = false,
        bleeding = false,
        severity = 0,
        health = 100,
        damage = 10,
    },
    ["LArm"] = {
        bullets = 0,
        broken = false,
        bleeding = false,
        severity = 0,
        health = 100,
        damage = 10,
    },
    ["RArm"] = {
        bullets = 0,
        broken = false,
        bleeding = false,
        severity = 0,
        health = 100,
        damage = 10,
    },
    ["LKnee"] = {
        bullets = 0,
        broken = false,
        bleeding = false,
        severity = 0,
        health = 100,
        damage = 10,
    },
    ["RKnee"] = {
        bullets = 0,
        broken = false,
        bleeding = false,
        severity = 0,
        health = 100,
        damage = 10,
    },
}

Config.GetAlternativeBone = function(bone) 
    for k, v in pairs(Config.PlayerBones) do 
        if v == bone then 
            return v
        end
    end

    for k, v in pairs(Config.BoneGroups) do
        for kk, vv in pairs(v) do
            if vv == bone then
                return k
            end
        end
    end

    return false
end

RegisterNetEvent('inventory:client:UpdateOtherInventory', function(items, isError)
    SendNUIMessage({
        action = "update",
        inventory = items,
        maxweight = Config.MaxInventoryWeight,
        slots = Config.MaxInventorySlots,
        error = isError,
    })
end)

RegisterNetEvent('inventory:client:UpdatePlayerInventory', function(isError)
    SendNUIMessage({
        action = "update",
        inventory = PlayerData.items,
        maxweight = Config.MaxInventoryWeight,
        slots = Config.MaxInventorySlots,
        error = isError,
    })
end)

RegisterNetEvent('inventory:client:CraftItems', function(itemName, itemCosts, amount, toSlot, points)
    local ped = PlayerPedId()
    SendNUIMessage({
        action = "close",
    })
    isCrafting = true
    QBCore.Functions.Progressbar("repair_vehicle", Config.Lang["ProgressCrafting"], (math.random(2000, 5000) * amount), false, true, {
	    disableMovement = true,
	    disableCarMovement = true,
	    disableMouse = false,
	    disableCombat = true,
	}, {
	    animDict = "mini@repair",
	    anim = "fixing_a_player",
	    flags = 16,
	}, {}, {}, function() -- Done
	    StopAnimTask(ped, "mini@repair", "fixing_a_player", 1.0)
            TriggerServerEvent("inventory:server:CraftItems", itemName, itemCosts, amount, toSlot, points)
            TriggerEvent('inventory:client:ItemBox', QBCore.Shared.Items[itemName], 'add')
            isCrafting = false
	end, function() -- Cancel
	    StopAnimTask(ped, "mini@repair", "fixing_a_player", 1.0)
            QBCore.Functions.Notify(Config.Lang["NotifyFailed"], "error")
            isCrafting = false
	end)
end)

RegisterNetEvent('inventory:client:CraftAttachment', function(itemName, itemCosts, amount, toSlot, points)
    local ped = PlayerPedId()
    SendNUIMessage({
        action = "close",
    })
    isCrafting = true
    QBCore.Functions.Progressbar("repair_vehicle", Config.Lang["ProgressCrafting"], (math.random(2000, 5000) * amount), false, true, {
	    disableMovement = true,
	    disableCarMovement = true,
	    disableMouse = false,
	    disableCombat = true,
	}, {
	    animDict = "mini@repair",
	    anim = "fixing_a_player",
	    flags = 16,
	}, {}, {}, function() -- Done
	    StopAnimTask(ped, "mini@repair", "fixing_a_player", 1.0)
            TriggerServerEvent("inventory:server:CraftAttachment", itemName, itemCosts, amount, toSlot, points)
            TriggerEvent('inventory:client:ItemBox', QBCore.Shared.Items[itemName], 'add')
            isCrafting = false
	end, function() -- Cancel
	    StopAnimTask(ped, "mini@repair", "fixing_a_player", 1.0)
            QBCore.Functions.Notify(Config.Lang["NotifyFailed"], "error")
            isCrafting = false
	end)
end)

RegisterNetEvent('inventory:client:PickupSnowballs', function()
    local ped = PlayerPedId()
    LoadAnimDict('anim@mp_snowball')
    TaskPlayAnim(ped, 'anim@mp_snowball', 'pickup_snowball', 3.0, 3.0, -1, 0, 1, 0, 0, 0)
    QBCore.Functions.Progressbar("pickupsnowball", "Collecting snowballs..", 1500, false, true, {
        disableMovement = true,
        disableCarMovement = true,
        disableMouse = false,
        disableCombat = true,
    }, {}, {}, {}, function() -- Done
        ClearPedTasks(ped)
        TriggerServerEvent('inventory:server:snowball', 'add')
        TriggerEvent('inventory:client:ItemBox', QBCore.Shared.Items["snowball"], "add")
    end, function() -- Cancel
        ClearPedTasks(ped)
        QBInventoryNotify(Config.Lang["SnowballsCancelled"], "error")
    end)
end)

RegisterNetEvent('inventory:client:UseSnowball', function(amount)
    local ped = PlayerPedId()
    GiveWeaponToPed(ped, `weapon_snowball`, amount, false, false)
    SetPedAmmo(ped, `weapon_snowball`, amount)
    SetCurrentPedWeapon(ped, `weapon_snowball`, true)
end)

RegisterNetEvent('inventory:client:UseWeapon', function(weaponData, shootbool)
    local ped = PlayerPedId()
    local weaponName = tostring(weaponData.name)
    local weaponHash = joaat(weaponData.name)
    local weaponinhand = GetCurrentPedWeapon(PlayerPedId())
    if currentWeapon == weaponName and weaponinhand then
        TriggerEvent('weapons:client:DrawWeapon', nil)
        SetCurrentPedWeapon(ped, `WEAPON_UNARMED`, true)
        RemoveAllPedWeapons(ped, true)
        TriggerEvent('weapons:client:SetCurrentWeapon', nil, shootbool)
        currentWeapon = nil
    elseif weaponName == "weapon_stickybomb" or weaponName == "weapon_pipebomb" or weaponName == "weapon_smokegrenade" or weaponName == "weapon_flare" or weaponName == "weapon_proxmine" or weaponName == "weapon_ball"  or weaponName == "weapon_molotov" or weaponName == "weapon_grenade" or weaponName == "weapon_bzgas" then
        TriggerEvent('weapons:client:DrawWeapon', weaponName)
        GiveWeaponToPed(ped, weaponHash, 1, false, false)
        SetPedAmmo(ped, weaponHash, 1)
        SetCurrentPedWeapon(ped, weaponHash, true)
        TriggerEvent('weapons:client:SetCurrentWeapon', weaponData, shootbool)
        currentWeapon = weaponName
    elseif weaponName == "weapon_snowball" then
        TriggerEvent('weapons:client:DrawWeapon', weaponName)
        GiveWeaponToPed(ped, weaponHash, 10, false, false)
        SetPedAmmo(ped, weaponHash, 10)
        SetCurrentPedWeapon(ped, weaponHash, true)
        TriggerServerEvent('inventory:server:snowball', 'remove')
        TriggerEvent('weapons:client:SetCurrentWeapon', weaponData, shootbool)
        currentWeapon = weaponName
    else
        TriggerEvent('weapons:client:DrawWeapon', weaponName)
        TriggerEvent('weapons:client:SetCurrentWeapon', weaponData, shootbool)
        local ammo = tonumber(weaponData.info.ammo) or 0

        if weaponName == "weapon_petrolcan" or weaponName == "weapon_fireextinguisher" then
            ammo = 4000
        end

        GiveWeaponToPed(ped, weaponHash, ammo, false, false)
        SetPedAmmo(ped, weaponHash, ammo)
        SetCurrentPedWeapon(ped, weaponHash, true)

        if weaponData.info.attachments then
            for _, attachment in pairs(weaponData.info.attachments) do
                GiveWeaponComponentToPed(ped, weaponHash, joaat(attachment.component))
            end
        end

        currentWeapon = weaponName
    end
end)

RegisterNetEvent('inventory:client:CheckWeapon', function(weaponName)
    if currentWeapon ~= weaponName:lower() then return end
    local ped = PlayerPedId()
    TriggerEvent('weapons:ResetHolster')
    SetCurrentPedWeapon(ped, `WEAPON_UNARMED`, true)
    RemoveAllPedWeapons(ped, true)
    currentWeapon = nil
end)

RegisterNetEvent('inventory:client:AddDropItem', function(dropId, player, coords)
    local forward = GetEntityForwardVector(GetPlayerPed(GetPlayerFromServerId(player)))
    local x, y, z = table.unpack(coords + forward * 0.5)
    Drops[dropId] = {
        id = dropId,
        coords = {
            x = x,
            y = y,
            z = z - 0.3,
        },
    }
end)

RegisterNetEvent('inventory:client:RemoveDropItem', function(dropId)
    Drops[dropId] = nil
    if Config.UseItemDrop then
        RemoveNearbyDrop(dropId)
    else
        DropsNear[dropId] = nil
    end
end)

RegisterNetEvent('inventory:client:DropItemAnim', function()
    local ped = PlayerPedId()
    SendNUIMessage({
        action = "close",
    })
    RequestAnimDict("pickup_object")
    while not HasAnimDictLoaded("pickup_object") do
        Wait(7)
    end
    TaskPlayAnim(ped, "pickup_object" ,"pickup_low" ,8.0, -8.0, -1, 1, 0, false, false, false )
    Wait(2000)
    ClearPedTasks(ped)
end)

RegisterNetEvent('inventory:client:SetCurrentStash', function(stash)
    CurrentStash = stash
end)


RegisterNetEvent('inventory:client:craftTarget',function()
    local crafting = {}
    crafting.label = Config.Lang["LabelCraft"]
    crafting.items = GetThresholdItems()
    TriggerServerEvent("inventory:server:OpenInventory", "crafting", math.random(1, 99), crafting)
end)

-- Commands

RegisterCommand('closeinv', function()
    closeInventory()
end, false)

RegisterNetEvent("qb-inventory:client:closeinv", function()
    closeInventory()
end)

RegisterCommand('inventory', function()
    if IsNuiFocused() then return end
    if not isCrafting and not inInventory then
        if not PlayerData.metadata["isdead"] and not PlayerData.metadata["inlaststand"] and not PlayerData.metadata["ishandcuffed"] and not IsPauseMenuActive() then
            local ped = PlayerPedId()
            local curVeh = nil
            local VendingMachine = nil
            if not Config.UseTarget then VendingMachine = GetClosestVending() end

            if IsPedInAnyVehicle(ped, false) then -- Is Player In Vehicle
                local vehicle = GetVehiclePedIsIn(ped, false)
                CurrentGlovebox = QBCore.Functions.GetPlate(vehicle)
                curVeh = vehicle
                CurrentVehicle = nil
            else
                local vehicle = QBCore.Functions.GetClosestVehicle()
                if vehicle ~= 0 and vehicle ~= nil then
                    local pos = GetEntityCoords(ped)
					          local dimensionMin, dimensionMax = GetModelDimensions(GetEntityModel(vehicle))
					          local trunkpos = GetOffsetFromEntityInWorldCoords(vehicle, 0.0, (dimensionMin.y), 0.0)
                    if (IsBackEngine(GetEntityModel(vehicle))) then
                        trunkpos = GetOffsetFromEntityInWorldCoords(vehicle, 0.0, (dimensionMax.y), 0.0)
                    end
                    if #(pos - trunkpos) < 1.5 and not IsPedInAnyVehicle(ped) then
                        if GetVehicleDoorLockStatus(vehicle) < 2 then
                            CurrentVehicle = QBCore.Functions.GetPlate(vehicle)
                            curVeh = vehicle
                            CurrentGlovebox = nil
                        else
                            QBInventoryNotify(Config.Lang["VehicleLocked"], "error")
                            return
                        end
                    else
                        CurrentVehicle = nil
                    end
                else
                    CurrentVehicle = nil
                end
            end

            if CurrentVehicle then -- Trunk
                local vehicleModel = string.lower(GetDisplayNameFromVehicleModel(GetEntityModel(curVeh)))
                local vehicleClass = GetVehicleClass(curVeh)
                local maxweight
                local slots

                if Config.TrunkInventory.vehicles[vehicleModel] then
                    maxweight = Config.TrunkInventory.vehicles[vehicleModel].maxWeight
                    slots = Config.TrunkInventory.vehicles[vehicleModel].slots
                elseif Config.TrunkInventory.classes[vehicleClass] then
                    maxweight = Config.TrunkInventory.classes[vehicleClass].maxWeight
                    slots = Config.TrunkInventory.classes[vehicleClass].slots
                else
                    maxweight = Config.TrunkInventory.default.maxWeight
                    slots = Config.TrunkInventory.default.slots
                end

                local other = {
                    maxweight = maxweight,
                    slots = slots,
                }
                TriggerServerEvent("inventory:server:OpenInventory", "trunk", CurrentVehicle, other)
                OpenTrunk()
            elseif CurrentGlovebox then
                TriggerServerEvent("inventory:server:OpenInventory", "glovebox", CurrentGlovebox)
            elseif CurrentDrop ~= 0 then
                TriggerServerEvent("inventory:server:OpenInventory", "drop", CurrentDrop)
            elseif VendingMachine then
                local ShopItems = {}
                ShopItems.label = "Vending Machine"
                ShopItems.items = Config.VendingItem
                ShopItems.slots = #Config.VendingItem
                TriggerServerEvent("inventory:server:OpenInventory", "shop", "Vendingshop_"..math.random(1, 99), ShopItems)
            else
                openAnim()
                TriggerServerEvent("inventory:server:OpenInventory")
            end
        end
    end
end, false)

RegisterKeyMapping('inventory', 'Open Inventory', 'keyboard', Config.KeyBinds.Inventory)

RegisterCommand('hotbar', function()
    isHotbar = not isHotbar
    if not PlayerData.metadata['isdead'] and not PlayerData.metadata['inlaststand'] and not PlayerData.metadata['ishandcuffed'] and not IsPauseMenuActive() then
        ToggleHotbar(isHotbar)
    end
end, false)

RegisterKeyMapping('hotbar','Toggle Keybind Slots', 'keyboard', Config.KeyBinds.HotBar)

for i = 1, 6 do
    RegisterCommand('slot' .. i,function()
        if not PlayerData.metadata["isdead"] and not PlayerData.metadata["inlaststand"] and not PlayerData.metadata["ishandcuffed"] and not IsPauseMenuActive() and not LocalPlayer.state.inv_busy then
            if i == 6 then
                i = Config.MaxInventorySlots
            end
            TriggerServerEvent("inventory:server:UseItemSlot", i)
        end
    end, false)
    RegisterKeyMapping('slot' .. i, 'Uses the item in slot ' .. i, 'keyboard', i)
end

RegisterNetEvent('qb-inventory:client:giveAnim', function()
    LoadAnimDict('mp_common')
	TaskPlayAnim(PlayerPedId(), 'mp_common', 'givetake1_b', 8.0, 1.0, -1, 16, 0, 0, 0, 0)
end)

-- NUI

RegisterNUICallback('RobMoney', function(data, cb)
    TriggerServerEvent("police:server:RobPlayer", data.TargetId)
    cb('ok')
end)

RegisterNUICallback('Notify', function(data, cb)
    QBInventoryNotify(data.message, data.type)
    cb('ok')
end)

RegisterNUICallback('GetWeaponData', function(cData, cb)
    local data = {
        WeaponData = QBCore.Shared.Items[cData.weapon],
        AttachmentData = FormatWeaponAttachments(cData.ItemData)
    }
    cb(data)
end)

RegisterNUICallback('RemoveAttachment', function(data, cb)
    local ped = PlayerPedId()
    local WeaponData = QBCore.Shared.Items[data.WeaponData.name]
    print(data.AttachmentData.attachment:gsub("(.*).*_",''))
    data.AttachmentData.attachment = data.AttachmentData.attachment:gsub("(.*).*_",'')
    QBCore.Functions.TriggerCallback('weapons:server:RemoveAttachment', function(NewAttachments)
        if NewAttachments ~= false then
            local attachments = {}
            RemoveWeaponComponentFromPed(ped, GetHashKey(data.WeaponData.name), GetHashKey(data.AttachmentData.component))
            for _, v in pairs(NewAttachments) do
                attachments[#attachments+1] = {
                    attachment = v.item,
                    label = v.label,
                    image = QBCore.Shared.Items[v.item].image
                }
            end
            local DJATA = {
                Attachments = attachments,
                WeaponData = WeaponData,
            }
            cb(DJATA)
        else
            RemoveWeaponComponentFromPed(ped, GetHashKey(data.WeaponData.name), GetHashKey(data.AttachmentData.component))
            cb({})
        end
    end, data.AttachmentData, data.WeaponData)
end)

RegisterNUICallback('getCombineItem', function(data, cb)
    cb(QBCore.Shared.Items[data.item])
end)

RegisterNUICallback("CloseInventory", function()
    if currentOtherInventory == "none-inv" then
        CurrentDrop = nil
        CurrentVehicle = nil
        CurrentGlovebox = nil
        CurrentStash = nil
        SetNuiFocus(false, false)
        inInventory = false
        TriggerScreenblurFadeOut(1000)
        ClearPedTasks(PlayerPedId())
        return
    end
    if CurrentVehicle ~= nil then
        CloseTrunk()
        TriggerServerEvent("inventory:server:SaveInventory", "trunk", CurrentVehicle)
        CurrentVehicle = nil
    elseif CurrentGlovebox ~= nil then
        TriggerServerEvent("inventory:server:SaveInventory", "glovebox", CurrentGlovebox)
        CurrentGlovebox = nil
    elseif CurrentStash ~= nil then
        TriggerServerEvent("inventory:server:SaveInventory", "stash", CurrentStash)
        CurrentStash = nil
    else
        TriggerServerEvent("inventory:server:SaveInventory", "drop", CurrentDrop)
        CurrentDrop = nil
    end
    Wait(50)
    TriggerScreenblurFadeOut(1000)
    SetNuiFocus(false, false)
    inInventory = false
end)

RegisterNUICallback("UseItem", function(data, cb)
    TriggerServerEvent("inventory:server:UseItem", data.inventory, data.item)
    cb('ok')
end)

RegisterNUICallback("combineItem", function(data, cb)
    Wait(150)
    TriggerServerEvent('inventory:server:combineItem', data.reward, data.fromItem, data.toItem)
    cb('ok')
end)

RegisterNUICallback('combineWithAnim', function(data, cb)
    local ped = PlayerPedId()
    local combineData = data.combineData
    local aDict = combineData.anim.dict
    local aLib = combineData.anim.lib
    local animText = combineData.anim.text
    local animTimeout = combineData.anim.timeOut
    QBCore.Functions.Progressbar("combine_anim", animText, animTimeout, false, true, {
        disableMovement = false,
        disableCarMovement = true,
        disableMouse = false,
        disableCombat = true,
    }, {
        animDict = aDict,
        anim = aLib,
        flags = 16,
    }, {}, {}, function() -- Done
        StopAnimTask(ped, aDict, aLib, 1.0)
        TriggerServerEvent('inventory:server:combineItem', combineData.reward, data.requiredItem, data.usedItem)
    end, function() -- Cancel
        StopAnimTask(ped, aDict, aLib, 1.0)
        QBCore.Functions.Notify(Config.Lang["NotifyFailed"], "error")
    end)
    cb('ok')
end)

RegisterNUICallback("SetInventoryData", function(data, cb)
    TriggerServerEvent("inventory:server:SetInventoryData", data.fromInventory, data.toInventory, data.fromSlot, data.toSlot, data.fromAmount, data.toAmount)
    cb('ok')
end)

RegisterNUICallback("PlayDropSound", function(_, cb)
    PlaySound(-1, "CLICK_BACK", "WEB_NAVIGATION_SOUNDS_PHONE", 0, 0, 1)
    cb('ok')
end)

RegisterNUICallback("PlayDropFail", function(_, cb)
    PlaySound(-1, "Place_Prop_Fail", "DLC_Dmod_Prop_Editor_Sounds", 0, 0, 1)
    cb('ok')
end)

RegisterNUICallback('GiveItem', function(data, cb)
    local player, distance = QBCore.Functions.GetClosestPlayer(GetEntityCoords(PlayerPedId()))
    if player ~= -1 and distance < 3 then
        if data.inventory == 'player' then
            local playerId = GetPlayerServerId(player)
            SetCurrentPedWeapon(PlayerPedId(), 'WEAPON_UNARMED', true)
            TriggerServerEvent('inventory:server:GiveItem', playerId, data.item.name, data.amount, data.item.slot)
        else
            QBInventoryNotify(Config.Lang["YouDoNotOwnThisItem"], "error")
        end
    else
        QBInventoryNotify(Config.Lang["NoOneNearby"], "error")
    end
    cb('ok')
end)


-- Threads

CreateThread(function()
    while true do
        local sleep = 100
        if DropsNear ~= nil then
			local ped = PlayerPedId()
			local closestDrop = nil
			local closestDistance = nil
            for k, v in pairs(DropsNear) do

                if DropsNear[k] ~= nil then

					local coords = (v.object ~= nil and GetEntityCoords(v.object)) or vector3(v.coords.x, v.coords.y, v.coords.z)
					local distance = #(GetEntityCoords(ped) - coords)
					if distance < 2 and (not closestDistance or distance < closestDistance) then
						closestDrop = k
						closestDistance = distance
					end
                end
            end


			if not closestDrop then
				CurrentDrop = 0
			else
				CurrentDrop = closestDrop
			end
        end
        Wait(sleep)
    end
end)

CreateThread(function()
    while true do
        if Drops ~= nil and next(Drops) ~= nil then
            local pos = GetEntityCoords(PlayerPedId(), true)
            for k, v in pairs(Drops) do
                if Drops[k] ~= nil then
                    local dist = #(pos - vector3(v.coords.x, v.coords.y, v.coords.z))
                    if dist < Config.MaxDropViewDistance then
                        DropsNear[k] = v
                    else
                        if Config.UseItemDrop and DropsNear[k] then
                            RemoveNearbyDrop(k)
                        else
                            DropsNear[k] = nil
                        end
                    end
                end
            end
        else
            DropsNear = {}
        end
        Wait(500)
    end
end)

	-- Извличане на параметрите от lib
	local getCraftMenuOpen = exports['ls-lib']:getCraftMenuOpen()
	local getAttachMenuOpen = exports['ls-lib']:getAttachMenuOpen()
    --qb-target
	RegisterNetEvent("inventory:client:Crafting", function(dropId)
		--if LocalPlayer.state['isLoggedIn'] and PlayerData.gang.name ~= "none" then
			local crafting = {}
			crafting.label = Config.Lang["LabelCraft"]
			crafting.items = GetThresholdItems()
			TriggerServerEvent("inventory:server:OpenInventory", getCraftMenuOpen.eventType, getCraftMenuOpen.randomValue, crafting)
		--end
	end)
    
    
	RegisterNetEvent("inventory:client:WeaponAttachmentCrafting", function(dropId)
		if LocalPlayer.state['isLoggedIn'] and QBCore.Functions.GetPlayerData().gang.name ~= "none" then
			local crafting = {}
			crafting.label = Config.Lang["LabelACraft"]
			crafting.items = GetAttachmentThresholdItems()
			TriggerServerEvent("inventory:server:OpenInventory", getAttachMenuOpen.eventType, getAttachMenuOpen.randomValue, crafting)
		else
			QBCore.Functions.Notify('Access rejected...', 'error')
		end
	end)

    if Config.BinEnable == true then 
        local searched = {3423423}
        local canSearch = true
        
        RegisterNetEvent('inventory:client:searchtrash', function()
            if canSearch then
                local ped = GetPlayerPed(-1)
                local pos = GetEntityCoords(ped)
                local dumpsterFound = false
                
                for i = 1, #Config.Objects do
                    local dumpster = GetClosestObjectOfType(pos.x, pos.y, pos.z, 1.0, Config.Objects[i], false, false, false)
                    local dumpPos = GetEntityCoords(dumpster)
                    local dist = GetDistanceBetweenCoords(pos.x, pos.y, pos.z, dumpPos.x, dumpPos.y, dumpPos.z, true)
                    
                    if dist < 1.8 then
                        for i = 1, #searched do
                            if searched[i] == dumpster then
                                dumpsterFound = true
                            end
                            if i == #searched and dumpsterFound then
                                QBInventoryNotify(Config.Lang["DumpsterAlreadySearched"], "error")
                            elseif i == #searched and not dumpsterFound then
                                
                                local itemType = math.random(#Config.RewardTypes)
                                TriggerEvent('inventory:client:progressbar', itemType)
                                TriggerServerEvent('qb-inventory:server:startDumpsterTimer', dumpster)
                                table.insert(searched, dumpster)
                            end
                        end
                    end
                end
            end
        end)
        
        RegisterNetEvent('inventory:server:removeDumpster', function(object)
            for i = 1, #searched do
                if searched[i] == object then
                    table.remove(searched, i)
                end
            end
        end)
        
        RegisterNetEvent('inventory:client:progressbar', function(itemType)
            local item = math.random(#Config.RewardsSmall)
            QBCore.Functions.Progressbar("trash_find", "Searching Bin..", Config.SearchBinProgress, false, true, {
                disableMovement = false,
                disableCarMovement = false,
                disableMouse = false,
                disableCombat = true,
            }, {
                animDict = "amb@prop_human_bum_bin@idle_b",
                anim = "idle_d",
                flags = 16,
            }, {}, {}, function()-- Done
                StopAnimTask(PlayerPedId(), "amb@prop_human_bum_bin@idle_b", "idle_d", 1.0)
                if Config.RewardTypes[itemType].type == "item" then
                    QBInventoryNotify(Config.Lang["FoundSomething"], "success")
                    TriggerServerEvent('inventory:server:recieveItem', Config.RewardsSmall[item].item, math.random(Config.RewardsSmall[item].minAmount, Config.RewardsSmall[item].maxAmount))
                    TriggerEvent('inventory:client:ItemBox', QBCore.Shared.Items[Config.RewardsSmall[item].item], "add")
                elseif Config.RewardTypes[itemType].type == "money" then
                    QBInventoryNotify(Config.Lang["FoundMoneyDumpster"], "success")
                    TriggerServerEvent('inventory:server:givemoney', math.random(100, 400))
                elseif Config.RewardTypes[itemType].type == "nothing" then
                    QBInventoryNotify(Config.Lang["FoundNothingDumpster"], "error")
                end
            end, function()-- Cancel
                StopAnimTask(PlayerPedId(), "amb@prop_human_bum_bin@idle_b", "idle_d", 1.0)
                QBInventoryNotify(Config.Lang["StoppedSearching"], "error")
            end)
        end)

    CreateThread(function()
        if Config.TargetSystem == "qb_target" then
        exports['qb-target']:AddTargetModel(Config.Objects, {
            options = {
                {
                    event = "inventory:client:searchtrash",
                    icon = "fas fa-pencil-ruler",
                    label = "Search Trash",
                },
            },
            distance = 2.1
        })
    elseif Config.TargetSystem == "customtarget" then
        exports[Config.CustomTarget]:AddTargetModel(Config.Objects, {
            options = {
                {
                    event = "inventory:client:searchtrash",
                    icon = "fas fa-pencil-ruler",
                    label = "Search Trash",
                },
            },
            distance = 2.1
        })
    elseif Config.TargetSystem == "ox_target" then
        exports.ox_target:addModel(Config.Objects, {
            {
                event = "inventory:client:searchtrash",
                icon = "fas fa-pencil-ruler",
                label = "Search Trash",
            },
        })
    elseif Config.TargetSystem == "interact" then
        local binobjects = { -- The mighty list of vending machines
        `prop_dumpster_01a`,
        `prop_dumpster_02b`,
        `prop_dumpster_3a`,
        `prop_dumpster_4a`,
        `prop_dumpster_4b`,
        `prop_dumpster_02a`
        }
    
        for i = 1, #binobjects do
        exports.interact:AddModelInteraction({
            model = binobjects[i],
            offset = vec3(0.0, 0.0, 1.0), -- optional
            -- bone = 'engine', -- optional
            -- name = 'interactionName', -- optional
            id = 'trashsearch_', -- needed for removing interactions
            distance = 4.0, -- optional
            interactDst = 1.5, -- optional
            ignoreLos = true,
            options = {
                {
                    event = "inventory:client:searchtrash",
                    label = 'Search Trash',
                },
            },
        })
    end
    end
    end)
end

    if Config.Print == true then

    AddEventHandler('onResourceStop', function(resourceName) if resourceName ~= GetCurrentResourceName() then return end
    if (GetCurrentResourceName() ~= resourceName) then        
        return
    end
        print('^5--<^3!^5>-- ^5Reload ^5| ^5--<^3!^5>--^5Inventory V1.0.0 Stopped Successfully^5--<^3!^5>--^7')
end)

AddEventHandler('onResourceStart', function(resourceName) if resourceName ~= GetCurrentResourceName() then return end
    if (GetCurrentResourceName() ~= resourceName) then        
        return
    end
        print('^5--<^3!^5>-- ^5Reload ^5| ^5--<^3!^5>--^5Inventory V1.0.0 Started Successfully^5--<^3!^5>--^7')
end)
end

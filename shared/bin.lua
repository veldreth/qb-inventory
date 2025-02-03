--TRASH CONFIG 
--IF Config.BinEnable = false then everything below will be disabled
Config.BinEnable = true

Config.SearchBinProgress = math.random(3000, 5000)

Config.Timer = 10 -- in seconds

--33% on each to get money/an item or nothing
Config.RewardTypes = {
    [1] = {
        type = "item"
    },
    [2] = {
        type = "money",
    },
    [3] = {
        type = "nothing",
    }
}

--Rewards for small trashcans
Config.RewardsSmall = {
    [1] = {item = "cokebaggy", minAmount = 1, maxAmount = 3},
    [2] = {item = "lockpick", minAmount = 1, maxAmount = 2},
    --[3] = {item = "vinremover", minAmount = 1, maxAmount = 1},
    [3] = {item = "rolling_paper", minAmount = 1, maxAmount = 4},
    [4] = {item = "plastic", minAmount = 1, maxAmount = 7},
    [5] = {item = "metalscrap", minAmount = 1, maxAmount = 5},
    [6] = {item = "repairkit", minAmount = 1, maxAmount = 2},
}

--END

--Bin Objects

Config.Objects = {
    -- Bins
    `prop_bin_08a`,
    `prop_dumpster_02a`,
    `prop_bin_01a`,
    `prop_bin_07c`,
    `prop_bin_07a`,
    --`161465839`,
    `prop_cs_bin_02`,
    `prop_dumpster_01a`,
    `prop_dumpster_4b`,
    `prop_dumpster_4a`,
}

--END HERE
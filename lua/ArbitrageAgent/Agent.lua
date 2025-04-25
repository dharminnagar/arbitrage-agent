-- Arbitrage Agent for Arweave DEXes
local bint = require('.bint')(256)
local json = require('json')


-- DONT MAINTAIN TIME YOURSELF. THE CRON WILL BE AUTO TRIGGERED
-- Initialize state

-- SCAN HAPPENS AUTOMATICALLY BY THE CRON SYSTEM
ArbitrageConfig = ArbitrageConfig or {
  OriginalSender = nil,
  inputToken = nil,       -- Token to arbitrage
  targetToken = nil,      -- Target token to pair with
  inputTokenAmount = nil,
  slippage = "00000000000",         -- Default slippage in permille (0.5%) - converted to Winston
  minProfitThreshold = "000000000000", -- Min profit threshold in permille (0.5%) - converted to Winston
  dexProcesses = {},      -- List of DEX process IDs to monitor
  enabled = false         -- Is arbitrage monitoring enabled
}

ArbitrageState = ArbitrageState or {
  balance = "0000000000000",          -- Current balance of inputToken (in Winston)
  profitHistory = {},     -- History of profitable trades
  totalProfit = "0000000000000"       -- Total profit earned (in Winston)
}

-- Utility functions for bint operations
local utils = {
  add = function(a, b)
    return tostring(a + b)
  end,
  subtract = function(a, b)
    return tostring(a - b)
  end,
  multiply = function(a, b)
    return tostring(a * b)
  end,
  divide = function(a, b)
    return tostring(a) / tostring(b)
  end,
  lessThan = function(a, b)
    return a < b
  end,
  greaterThan = function(a, b)
    return a > b
  end,
  equals = function(a, b)
    return a == b
  end,
  calculateProfit = function(initialAmount, finalAmount)
    if initialAmount == "0000000000000" then return "0000000000000" end
    local profit = finalAmount - initialAmount
    return tostring(profit)
  end,
  calculateProfitPercentage = function(initialAmount, finalAmount)
    if initialAmount == "0000000000000" then return "0000000000000" end
    local profit = finalAmount - initialAmount
    local percentage = (profit * 1000) / initialAmount
    return tostring(percentage)
  end,
  -- Function to convert values to Winston format (ensuring 12 decimal places)
  toWinston = function(value)
    if value == nil then return "0000000000000" end
    
    local strValue = tostring(value)
    -- Remove any decimal points and non-numeric characters
    strValue = strValue:gsub("[^%d]", "")
    
    -- Pad with zeros to ensure Winston format (12 decimal places)
    while #strValue < 12 do
      strValue = strValue .. "0"
    end
    
    -- If it's just zeros, ensure proper format
    if tonumber(strValue) == 0 then
      return "0000000000000"
    end
    
    return strValue
  end
}

-- Helper function to check if a value exists in a table
local function contains(table, val)
  for i=1, #table do
    if table[i] == val then 
      return true
    end
  end
  return false
end


-- Setup handler - Configure the arbitrage agent
Handlers.add('Setup', 'Setup', function(msg)
  assert(type(msg.InputToken) == 'string', 'InputToken is required!')
  assert(type(msg.TargetToken) == 'string', 'TargetToken is required!')
  assert(type(msg.OriginalSender) == 'string', 'original sender is required!')
  assert(type(msg.InputTokenAmount) == 'string', 'Input token amount is required!')
  
  ArbitrageConfig.inputToken = msg.InputToken
  ArbitrageConfig.targetToken = msg.TargetToken
  ArbitrageConfig.OriginalSender = msg.OriginalSender
  
  -- Convert InputTokenAmount to Winston format
  ArbitrageConfig.inputTokenAmount = utils.toWinston(msg.InputTokenAmount)
  
  if msg.Slippage and type(msg.Slippage) == 'string' then
    -- Convert Slippage to Winston format
    ArbitrageConfig.slippage = utils.toWinston(msg.Slippage)
  end
  
  if msg.MinProfitThreshold and type(msg.MinProfitThreshold) == 'string' then
    -- Convert MinProfitThreshold to Winston format
    ArbitrageConfig.minProfitThreshold = utils.toWinston(msg.MinProfitThreshold)
  end

  --Get the amount of input token from the user to this process.
  
  Send({
    Target = "naoSsbeWp2qO-CYUfKwEZJpxleRSoNye6DJXRCoXw8U",
    TokenId = msg.InputToken,
    Action = "TransferFunds",
    Recipient = ao.id,
    Quantity = ArbitrageConfig.inputTokenAmount, -- Use converted Winston value
    OriginalSender = msg.OriginalSender
  })
  local amount = Receive({
    Action = "Transfer_Executed"
  }).Data

  msg.reply({
    Action = 'Setup-Complete',
    InputToken = ArbitrageConfig.inputToken,
    TargetToken = ArbitrageConfig.targetToken,
    Slippage = ArbitrageConfig.slippage,
    MinProfitThreshold = ArbitrageConfig.minProfitThreshold,
    Data = "Arbitrage agent configured successfully"
  })
end)

-- Add DEX handler - Add a DEX process to monitor
Handlers.add('AddDEX', 'AddDEX', function(msg)
  assert(type(msg.DexProcessId) == 'string', 'DexProcessId is required!')
  
  if not contains(ArbitrageConfig.dexProcesses, msg.DexProcessId) then
    table.insert(ArbitrageConfig.dexProcesses, msg.DexProcessId)
  end
  
  msg.reply({
    Action = 'AddDEX-Complete',
    DexProcessId = msg.DexProcessId,
    -- @NOTE - DEX COUNT CAN CAUSE PROBLEMS 
    DexCount = #ArbitrageConfig.dexProcesses,
    Data = "DEX added successfully. Total DEXes: " .. #ArbitrageConfig.dexProcesses
  })
end)

-- List DEXes handler
Handlers.add('ListDEXes', 'ListDEXes', function(msg)
  msg.reply({
    Action = 'ListDEXes-Complete',
    -- @NOTE - arbitrage config count CAN CAUSE PROBLEMS
    DexCount = #ArbitrageConfig.dexProcesses,
    DexList = json.encode(ArbitrageConfig.dexProcesses),
    Data = "Total DEXes: " .. #ArbitrageConfig.dexProcesses
  })
end)

-- Start arbitrage monitoring
Handlers.add('Start', 'Start', function(msg)
  assert(ArbitrageConfig.inputToken, 'Setup required before starting!')
  assert(ArbitrageConfig.targetToken, 'Setup required before starting!')
  assert(#ArbitrageConfig.dexProcesses >= 2, 'At least 2 DEXes required for arbitrage!')
  
  ArbitrageConfig.enabled = true
  
  msg.reply({
    Action = 'Start-Complete',
    Data = "Arbitrage monitoring started. Waiting for next automatic scan."
  })
end)

-- Stop arbitrage monitoring
Handlers.add('Stop', 'Stop', function(msg)
  ArbitrageConfig.enabled = false
  
  msg.reply({
    Action = 'Stop-Complete',
    Data = "Arbitrage monitoring stopped"
  })
end)

-- Get the status of the arbitrage agent
Handlers.add('Status', 'Status', function(msg)
  msg.reply({
    Action = 'Status-Complete',
    Enabled = ArbitrageConfig.enabled,
    InputToken = ArbitrageConfig.inputToken,
    TargetToken = ArbitrageConfig.targetToken,
    Slippage = ArbitrageConfig.slippage,
    MinProfitThreshold = ArbitrageConfig.minProfitThreshold,
    DexCount = #ArbitrageConfig.dexProcesses,
    TotalProfit = ArbitrageState.totalProfit,
    Balance = ArbitrageState.balance,
    Data = "Arbitrage agent status"
  })
end)

-- Execute swap on a specific DEX
local function executeSwap(dexProcessId, baseToken, quoteToken, inputToken, inputAmount, expectedOutputAmount)
    -- Execute the swap on the DEX
    print("Executing swap on DEX: " .. dexProcessId)
    
    -- Ensure values are in proper format (remove any decimal points)
    local formattedInputAmount = utils.toWinston(inputAmount)
    
    -- Handle potential scientific notation in expected output
    local expectedOutputStr = tostring(expectedOutputAmount)
    local expectedOutputNum
    
    -- Check if the value is in scientific notation (contains 'e')
    if expectedOutputStr:match("e") then
        -- Parse scientific notation
        local mantissa, exponent = expectedOutputStr:match("([^e]+)e([^e]+)")
        mantissa = tonumber(mantissa)
        exponent = tonumber(exponent)
        
        -- Convert scientific notation to a regular number
        expectedOutputNum = mantissa * (10 ^ exponent)
        print("Converted scientific notation: " .. expectedOutputStr .. " to " .. expectedOutputNum)
    else
        expectedOutputNum = tonumber(expectedOutputStr)
    end
    
    -- Calculate minimum output with proper numeric operations
    local minOutputMultiplier = 0.995  -- 0.5% slippage (hardcoded for safety)
    local minOutputAmount = expectedOutputNum * minOutputMultiplier
    
    -- Format as integer string with no scientific notation or decimal point
    local formattedMinOutput = string.format("%.0f", minOutputAmount)
    
    print("Input amount: " .. formattedInputAmount)
    print("Expected output (formatted): " .. string.format("%.0f", expectedOutputNum))
    print("Min output with slippage: " .. formattedMinOutput)
    
    -- Add debugging
    print("Sending swap request to DEX: " .. dexProcessId)
    print("With params: BaseToken=" .. baseToken .. ", QuoteToken=" .. quoteToken .. ", InputToken=" .. inputToken)
    
    Send({
      Target = dexProcessId,
      Action = "Swap",
      BaseToken = baseToken,
      QuoteToken = quoteToken,
      InputToken = inputToken,
      InputAmount = formattedInputAmount,
      MinOutputAmount = formattedMinOutput,
      From = ao.id,  -- Add From field
      OriginalSender = ArbitrageConfig.OriginalSender
    })
    
    print("Waiting for swap response...")
    
    -- Wait for swap completion with timeout handling
    local swapResult = Receive({
      Action = "Swap-Complete"
    }, 10000)  -- Add 10-second timeout
    
    if not swapResult then
      print("ERROR: response timeout - no response received")
      return "0"
    end
    
    print("Swap completed. Output amount: " .. swapResult.OutputAmount)
    return utils.toWinston(swapResult.OutputAmount)
end


Handlers.add("CheckAndSwap", "CheckAndSwap", function(msg)
  print('CheckAndSwap handler reached')

  local performArbitrageOn = msg.Data
  local buyPrice = utils.toWinston(performArbitrageOn.buy.price)
  local sellPrice = utils.toWinston(performArbitrageOn.sell.price)
  local profit = utils.calculateProfit(buyPrice, sellPrice)

  print("BUY PRICE: " .. buyPrice)
  print("SELL PRICE: " .. sellPrice)
  print("Potential profit: " .. profit)

  if profit > "000000000000" then  -- 0.5 AR in Winston
    -- Calculate expected output amount for first swap
    local expectedOutputAmount1 = utils.divide(
      utils.multiply(ArbitrageConfig.inputTokenAmount, "1000000000000"),
      buyPrice
    )
    print("Expected output from first swap: " .. expectedOutputAmount1)
    
    -- First swap: Agent -> Dex1 (TokenA -> TokenB)
    local outputAmount1 = executeSwap(
      performArbitrageOn.buy.dexId,
      ArbitrageConfig.inputToken,
      ArbitrageConfig.targetToken,
      ArbitrageConfig.inputToken,
      ArbitrageConfig.inputTokenAmount,
      expectedOutputAmount1  -- Pass expected output amount, not profit
    )

    -- Calculate expected output for second swap - avoid scientific notation
    local outputAmount1Num = tonumber(outputAmount1)
    local sellPriceNum = tonumber(sellPrice)
    local expectedOutputRaw = outputAmount1Num * sellPriceNum / 1000000000000
    local expectedOutputAmount2 = string.format("%.0f", expectedOutputRaw)  -- Format as integer

    print("Expected output from second swap: " .. expectedOutputAmount2)
    
    -- Second swap: Agent -> Dex2 (TokenB -> TokenA)
    local outputAmount2 = executeSwap(
      performArbitrageOn.sell.dexId,
      ArbitrageConfig.inputToken,
      ArbitrageConfig.targetToken,
      ArbitrageConfig.targetToken,
      outputAmount1,
      expectedOutputAmount2
    )

    -- Update the balance
    ArbitrageState.balance = utils.subtract(ArbitrageState.balance, ArbitrageConfig.inputTokenAmount)
    ArbitrageState.balance = utils.add(ArbitrageState.balance, outputAmount2)

    -- Calculate actual profit
    local actualProfit = utils.subtract(outputAmount2, ArbitrageConfig.inputTokenAmount)
    
    -- Store this profit in history
    table.insert(ArbitrageState.profitHistory, {
      timestamp = os.time(),
      inputAmount = ArbitrageConfig.inputTokenAmount,
      outputAmount = outputAmount2,
      profit = actualProfit
    })
    
    -- Update total profit
    ArbitrageState.totalProfit = utils.add(ArbitrageState.totalProfit, actualProfit)

    -- Notify about the arbitrage execution
    Send({
      Target = ArbitrageConfig.OriginalSender,
      Action = "ArbitrageExecuted",
      BuyDex = performArbitrageOn.buy.dexId,
      SellDex = performArbitrageOn.sell.dexId,
      InputAmount = ArbitrageConfig.inputTokenAmount,
      FinalAmount = outputAmount2,
      ActualProfit = actualProfit,
      Data = "Executed arbitrage successfully"
    })
  else
    print("Potential profit below threshold. No arbitrage executed.")
  end
end)

Handlers.add("GetExtremes", "GetExtremes", function(msg)
  print('reached here')

  local prices = msg.Data
  -- Find highest and lowest prices
  local highestPrice = "0000000000000"
  local lowestPrice = "99900000000000000000000"  -- Very high initial value in Winston
  local highestDexId = ""
  local lowestDexId = ""
  
  for dexId, price in pairs(prices) do
    -- Convert price to Winston format
    local winstonPrice = utils.toWinston(price)
    print("Price from DEX " .. dexId .. ": " .. winstonPrice)
    
    if utils.greaterThan(winstonPrice, highestPrice) then
      highestPrice = winstonPrice
      highestDexId = dexId
    end
    
    if utils.lessThan(winstonPrice, lowestPrice) then
      lowestPrice = winstonPrice
      lowestDexId = dexId
    end
  end
  
  print("Lowest price: " .. lowestPrice .. " at DEX: " .. lowestDexId)
  print("Highest price: " .. highestPrice .. " at DEX: " .. highestDexId)

  
  -- Create performArbitrageOn table with the highest and lowest price information
  local performArbitrageOn = {
    buy = {
      dexId = lowestDexId,
      price = lowestPrice
    },
    sell = {
      dexId = highestDexId,
      price = highestPrice
    }
  }
  print(performArbitrageOn);
  
  Send({
    Target = ao.id,
    Action = "CheckAndSwap",
    Data = performArbitrageOn
  })
end)

Handlers.add("getPrices", "getPrices", function(msg)
  -- This is to handle notifications from DEX processes or other sources
  -- about potential arbitrage opportunities
  local prices = {}
  for _, dexId in ipairs(ArbitrageConfig.dexProcesses) do
    -- Then, get the price
    Send({
        Target = dexId,
        Action = "GetPrice",
        BaseToken = ArbitrageConfig.inputToken,
        QuoteToken = ArbitrageConfig.targetToken,
    })
    local priceResponse = Receive({
        Action = "GetPrice-Complete"
    })
    
    -- Convert the received price to Winston format
    local winstonPrice = utils.toWinston(priceResponse.Price)
    print("Price from DEX " .. dexId .. ": " .. winstonPrice)
    -- Store the price in the prices table with dexId as the key
    prices[dexId] = winstonPrice
    
  end
  
  Send({
    Target = ao.id,
    Action = 'GetExtremes',
    Data = prices
  })
  
  -- Potentially analyze and execute arbitrage based on notification
end)

-- Core function to scan for arbitrage opportunities
local function scanForArbitrage()
  if not ArbitrageConfig.enabled then return end
  
  -- Get balance of input token
  --@NOTE THIS WILL NOT WORK (FROM) Where are we storing the balance?
  Send({
    Target = ArbitrageConfig.inputToken,
    Action = "Balance",
    Recipient = ao.id,
  })
  local balanceResponse = Receive({
    Action = "recievedBalance"
  })
  
  -- Convert balance to Winston format
  local balanceOfThisProcess = utils.toWinston(balanceResponse.Data)
  
  print("The balance is :" .. balanceOfThisProcess);

  -- Get prices from all configured DEXes
  Send({
    Target = ao.id,
    Action = "getPrices"
  })

  local prices = Receive({
    Action = "getPrices-Received"
  }).Data

  print("Prices received from DEXes: " )

  --   -- Execute the arbitrage
  --   executeSwap(
  --     lowestDexId,
  --     ArbitrageConfig.inputToken,
  --     ArbitrageConfig.targetToken,
  --     ArbitrageConfig.inputToken,
  --     amountGained,
  --     lowestPrice
  --   )
    
  --   executeSwap(
  --     highestDexId,
  --     ArbitrageConfig.inputToken,
  --     ArbitrageConfig.targetToken,
  --     ArbitrageConfig.targetToken,
  --     amountGained,
  --     highestPrice
  --   )
    
    -- -- Update the balance
    -- ArbitrageState.balance = utils.subtract(ArbitrageState.balance, amountGained)
    
    -- Notify about the arbitrage execution
  --   Send({
  --     Target = msg.From,
  --     Action = "ArbitrageExecuted",
  --     BuyDex = lowestDexId,
  --     SellDex = highestDexId,
  --     InputAmount = amountGained,
  --     Data = "Executed arbitrage successfully"
  --   })
  -- else
  --   -- Notify about no arbitrage opportunity
  --   Send({
  --     Target = msg.From,
  --     Action = "NoArbitrageOpportunity",
  --     Data = "No profitable arbitrage opportunity found"
  --   })
  -- end
end

-- Cron handler for automatic scanning
Handlers.add("CronTick",
  Handlers.utils.hasMatchingTag("Action", "Cron"),
  function(msg)
    if not ArbitrageConfig.enabled then return end
    print("Starting automatic scan for arbitrage opportunities...")
    -- Scan for arbitrage opportunities
    scanForArbitrage()
  end
)

-- Get profit history
Handlers.add('ProfitHistory', 'ProfitHistory', function(msg)
  msg.reply({
    Action = 'ProfitHistory-Complete',
    TotalProfit = ArbitrageState.totalProfit,
    History = json.encode(ArbitrageState.profitHistory),
    Data = "Profit history retrieved"
  })
end)

-- Handler to process arbitrage notifications
-- Handlers.add('ArbitrageNotification', 'ArbitrageNotification', function(msg)
--   -- This is to handle notifications from DEX processes or other sources
--   -- about potential arbitrage opportunities

--   msg.reply({
--     Action = 'ArbitrageNotification-Received',
--     Data = "Received arbitrage notification"
--   })

--   -- Potentially analyze and execute arbitrage based on notification
-- end)
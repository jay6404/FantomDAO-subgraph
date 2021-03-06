import {Address, BigDecimal, bigInt, BigInt, log} from '@graphprotocol/graph-ts'
import { CurveGaugeAllocator } from '../../generated/HectorStakingV1/CurveGaugeAllocator'
import {HectorERC20} from '../../generated/HectorStakingV1/HectorERC20';
import {sHectorERC20} from '../../generated/HectorStakingV1/sHectorERC20';
import {CirculatingSupply} from '../../generated/HectorStakingV1/CirculatingSupply';
import {ERC20} from '../../generated/HectorStakingV1/ERC20';
import {UniswapV2Pair} from '../../generated/HectorStakingV1/UniswapV2Pair';
import {HectorStaking} from '../../generated/HectorStakingV1/HectorStaking';
import {ethereum} from '@graphprotocol/graph-ts'

import {ProtocolMetric, LastBlock} from '../../generated/schema'
import {
    CIRCULATING_SUPPLY_CONTRACT,
    CIRCULATING_SUPPLY_CONTRACT_BLOCK,
    ERC20DAI_CONTRACT,
    HEC_ERC20_CONTRACT,
    SHEC_ERC20_CONTRACT_V1,
    STAKING_CONTRACT_V1,
    TREASURY_ADDRESS,
    USDC_ERC20_CONTRACT,
    WFTM_ERC20_CONTRACT,
    // SPIRIT_HECUSDC_PAIR,
    // SPIRIT_HECUSDC_PAIR_BLOCK,
    SPOOKY_HECDAI_PAIR,
    // SPOOKY_HECDAI_PAIR_BLOCK,
    // STAKING_CONTRACT_V2_BLOCK,
    // STAKING_CONTRACT_V2,
    // SHEC_ERC20_CONTRACT_V2_BLOCK,
    // SHEC_ERC20_CONTRACT_V2,
    // LOCKED_ADDRESS,
    MIM_ERC20_CONTRACT,
    FRAX_ERC20_CONTRACT,
    // SPOOKY_HECFRAX_PAIR,
    // SPOOKY_HECFRAX_PAIR_BLOCK,
    CURVE_GAUGE_ALLOCATOR_CONTRACT_BLOCK,
    CURVE_GAUGE_ALLOCATOR_CONTRACT,
    // SPIRIT_HECGOHM_PAIR_BLOCK,
    // SPIRIT_HECGOHM_PAIR
} from './Constants';
import {toDecimal} from './Decimals';
import {getHECUSDRate, getDiscountedPairUSD, getPairUSD, getFTMUSDRate} from './Price';


export function loadOrCreateProtocolMetric(blockNumber: BigInt, timestamp: BigInt): ProtocolMetric {
    let id = blockNumber.minus(blockNumber.mod(BigInt.fromString("16000")));

    let protocolMetric = ProtocolMetric.load(id.toString())
    if (protocolMetric == null) {
        protocolMetric = new ProtocolMetric(id.toString())
        protocolMetric.timestamp = timestamp
        protocolMetric.hecCirculatingSupply = BigDecimal.fromString("0")
        protocolMetric.sHecCirculatingSupply = BigDecimal.fromString("0")
        protocolMetric.totalSupply = BigDecimal.fromString("0")
        protocolMetric.hecPrice = BigDecimal.fromString("0")
        protocolMetric.marketCap = BigDecimal.fromString("0")
        protocolMetric.totalValueLocked = BigDecimal.fromString("0")
        protocolMetric.treasuryRiskFreeValue = BigDecimal.fromString("0")
        protocolMetric.treasuryMarketValue = BigDecimal.fromString("0")
        // protocolMetric.treasuryInvestments = BigDecimal.fromString("0")
        protocolMetric.nextEpochRebase = BigDecimal.fromString("0")
        protocolMetric.nextDistributedHec = BigDecimal.fromString("0")
        protocolMetric.currentAPY = BigDecimal.fromString("0")
        protocolMetric.treasuryDaiRiskFreeValue = BigDecimal.fromString("0")
        // protocolMetric.treasuryUsdcRiskFreeValue = BigDecimal.fromString("0")
        protocolMetric.treasuryDaiMarketValue = BigDecimal.fromString("0")
        // protocolMetric.treasuryUsdcMarketValue = BigDecimal.fromString("0")
        protocolMetric.treasuryWFTMRiskFreeValue = BigDecimal.fromString("0")
        protocolMetric.treasuryWFTMMarketValue = BigDecimal.fromString("0")
        protocolMetric.treasuryMIMRiskFreeValue = BigDecimal.fromString("0")
        protocolMetric.treasuryMIMMarketValue = BigDecimal.fromString("0")
        // protocolMetric.treasuryFRAXRiskFreeValue = BigDecimal.fromString("0")
        // protocolMetric.treasuryFRAXMarketValue = BigDecimal.fromString("0")
        // protocolMetric.treasuryGOHMRiskFreeValue = BigDecimal.fromString("0")
        // protocolMetric.treasuryGOHMMarketValue = BigDecimal.fromString("0")
        protocolMetric.treasuryHecDaiPOL = BigDecimal.fromString("0")
        // protocolMetric.treasuryHecUsdcPOL = BigDecimal.fromString("0")
        // protocolMetric.treasuryHecFraxPOL = BigDecimal.fromString("0")

        protocolMetric.save()
    }
    return protocolMetric as ProtocolMetric
}


function getTotalSupply(): BigDecimal {
    let hec_contract = HectorERC20.bind(Address.fromString(HEC_ERC20_CONTRACT))
    let total_supply = toDecimal(hec_contract.totalSupply(), 9)
    log.debug("Total Supply {}", [total_supply.toString()])
    return total_supply
}

function getCriculatingSupply(blockNumber: BigInt, total_supply: BigDecimal): BigDecimal {
    let circ_supply: BigDecimal
    log.debug("Circulating Supply",["Jay Test start"])
    if (blockNumber.gt(BigInt.fromString(CIRCULATING_SUPPLY_CONTRACT_BLOCK))) {
        let circulatingsupply_contract = CirculatingSupply.bind(Address.fromString(CIRCULATING_SUPPLY_CONTRACT))
        log.debug("Circulating Supply",["Jay before  start",blockNumber.toString()])
        circ_supply = toDecimal(circulatingsupply_contract.MAGICCirculatingSupply(), 9)
        log.debug("Circulating Supply",["Jay after start",blockNumber.toString()])
    } else {
        circ_supply = total_supply;
    }
    log.debug("Circulating Supply {}", [circ_supply.toString()])
    return circ_supply
}

function getShecSupply(blockNumber: BigInt): BigDecimal {
    let shec_contract_v1 = sHectorERC20.bind(Address.fromString(SHEC_ERC20_CONTRACT_V1))
    let shec_supply = toDecimal(shec_contract_v1.circulatingSupply(), 9)

    // if (blockNumber.gt(BigInt.fromString(SHEC_ERC20_CONTRACT_V2_BLOCK))) {
    //     let shec_contract_v2 = sHectorERC20.bind(Address.fromString(SHEC_ERC20_CONTRACT_V2))
    //     shec_supply = shec_supply.plus(toDecimal(shec_contract_v2.circulatingSupply(), 9))
    // }

    log.debug("sHEC Supply {}", [shec_supply.toString()])
    return shec_supply
}

function getHECDAIReserves(pair: UniswapV2Pair): BigDecimal[] {
    let reserves = pair.getReserves()
    let hecReserves = toDecimal(reserves.value0, 9)
    let daiReserves = toDecimal(reserves.value1, 18)
    return [hecReserves, daiReserves]
}

function getHECUSDCReserves(pair: UniswapV2Pair): BigDecimal[] {
    let reserves = pair.getReserves()
    let usdcReserves = toDecimal(reserves.value0, 6)
    let hecReserves = toDecimal(reserves.value1, 9)
    return [hecReserves, usdcReserves]
}

function getHECFRAXReserves(pair: UniswapV2Pair): BigDecimal[] {
    let reserves = pair.getReserves()
    let hecReserves = toDecimal(reserves.value0, 9)
    let fraxReserves = toDecimal(reserves.value1, 18)
    return [hecReserves, fraxReserves]
}

function getHECGOHMReserves(pair: UniswapV2Pair): BigDecimal[] {
    let reserves = pair.getReserves()
    let hecReserves = toDecimal(reserves.value0, 9)
    let gohmReserves = toDecimal(reserves.value1, 18)
    return [hecReserves, gohmReserves]
}

function getMV_RFV(blockNumber: BigInt): BigDecimal[] {
    let daiERC20 = ERC20.bind(Address.fromString(ERC20DAI_CONTRACT))
    let usdcERC20 = ERC20.bind(Address.fromString(USDC_ERC20_CONTRACT))
    let wftmERC20 = ERC20.bind(Address.fromString(WFTM_ERC20_CONTRACT))
    let mimERC20 = ERC20.bind(Address.fromString(MIM_ERC20_CONTRACT))
    let fraxERC20 = ERC20.bind(Address.fromString(FRAX_ERC20_CONTRACT))

    let hecdaiPair = UniswapV2Pair.bind(Address.fromString(SPOOKY_HECDAI_PAIR))
    // let hecfraxPair = UniswapV2Pair.bind(Address.fromString(SPOOKY_HECFRAX_PAIR))
    // let hecusdcPair = UniswapV2Pair.bind(Address.fromString(SPIRIT_HECUSDC_PAIR))
    // let hecgohmPair = UniswapV2Pair.bind(Address.fromString(SPIRIT_HECGOHM_PAIR))

    let daiBalance = daiERC20.balanceOf(Address.fromString(TREASURY_ADDRESS))
    let usdcBalance = usdcERC20.balanceOf(Address.fromString(TREASURY_ADDRESS))
    let mimBalance = mimERC20.balanceOf(Address.fromString(TREASURY_ADDRESS))
    let fraxBalance = fraxERC20.balanceOf(Address.fromString(TREASURY_ADDRESS))
    let wftmBalance = wftmERC20.balanceOf(Address.fromString(TREASURY_ADDRESS))
    let wftmValue = toDecimal(wftmBalance, 18).times(getFTMUSDRate())

    let hecusdRate = getHECUSDRate()

    //HECDAI Orignal Code
    let hecdaiBalance = hecdaiPair.balanceOf(Address.fromString(TREASURY_ADDRESS))
    // let hecdaiLockedBalance = hecdaiPair.balanceOf(Address.fromString(LOCKED_ADDRESS))
    let hecdaiTotalLP = toDecimal(hecdaiPair.totalSupply(), 18)
    let hecdaiReserves = getHECDAIReserves(hecdaiPair)
    let hecdaiPOL = toDecimal(hecdaiBalance, 18).div(hecdaiTotalLP).times(BigDecimal.fromString("100"))
    let hecdaiValue = getPairUSD(hecdaiBalance, hecdaiTotalLP, hecdaiReserves, hecusdRate, BigDecimal.fromString('1'))
    let hecdaiRFV = getDiscountedPairUSD(hecdaiBalance, hecdaiTotalLP, hecdaiReserves, BigDecimal.fromString('1'))
    
    
    //HECDAI
    // let hecdaiValue = BigDecimal.fromString('0');
    // let hecdaiRFV = BigDecimal.fromString('0')
    // let hecdaiPOL = BigDecimal.fromString('0')
    // if (blockNumber.gt(BigInt.fromString(SPOOKY_HECDAI_PAIR_BLOCK))) {
    //     let hecdaiBalance = hecdaiPair.balanceOf(Address.fromString(TREASURY_ADDRESS))
    //     let hecdaiTotalLP = toDecimal(hecdaiPair.totalSupply(), 18)
    //     let hecdaiReserves = getHECDAIReserves(hecdaiPair)
    //     hecdaiPOL = toDecimal(hecdaiBalance, 18).div(hecdaiTotalLP).times(BigDecimal.fromString("100"))
    //     hecdaiValue = getPairUSD(hecdaiBalance, hecdaiTotalLP, hecdaiReserves, hecusdRate, BigDecimal.fromString('1'))
    //     hecdaiRFV = getDiscountedPairUSD(hecdaiBalance, hecdaiTotalLP, hecdaiReserves, BigDecimal.fromString('1'))
    // }

    //HECUSDC
    // let hecusdcValue = BigDecimal.fromString('0');
    // let hecusdcRFV = BigDecimal.fromString('0')
    // let hecusdcPOL = BigDecimal.fromString('0')
    // if (blockNumber.gt(BigInt.fromString(SPIRIT_HECUSDC_PAIR_BLOCK))) {
    //     let hecusdcBalance = hecusdcPair.balanceOf(Address.fromString(TREASURY_ADDRESS))
    //     let hecusdcTotalLP = toDecimal(hecusdcPair.totalSupply(), 18)
    //     let hecusdcReserves = getHECUSDCReserves(hecusdcPair)
    //     hecusdcPOL = toDecimal(hecusdcBalance, 18).div(hecusdcTotalLP).times(BigDecimal.fromString("100"))
    //     hecusdcValue = getPairUSD(hecusdcBalance, hecusdcTotalLP, hecusdcReserves, hecusdRate, BigDecimal.fromString('1'))
    //     hecusdcRFV = getDiscountedPairUSD(hecusdcBalance, hecusdcTotalLP, hecusdcReserves, BigDecimal.fromString('1'))
    // }

    //HECFRAX
    // let hecfraxValue = BigDecimal.fromString('0');
    // let hecfraxRFV = BigDecimal.fromString('0')
    // let hecfraxPOL = BigDecimal.fromString('0')
    // if (blockNumber.gt(BigInt.fromString(SPOOKY_HECFRAX_PAIR_BLOCK))) {
    //     let hecfraxBalance = hecfraxPair.balanceOf(Address.fromString(TREASURY_ADDRESS))
    //     let hecfraxTotalLP = toDecimal(hecfraxPair.totalSupply(), 18)
    //     let hecfraxReserves = getHECFRAXReserves(hecfraxPair)
    //     hecfraxPOL = toDecimal(hecfraxBalance, 18).div(hecfraxTotalLP).times(BigDecimal.fromString("100"))
    //     hecfraxValue = getPairUSD(hecfraxBalance, hecfraxTotalLP, hecfraxReserves, hecusdRate, BigDecimal.fromString('1'))
    //     hecfraxRFV = getDiscountedPairUSD(hecfraxBalance, hecfraxTotalLP, hecfraxReserves, BigDecimal.fromString('1'))
    // }

    //HECGOHM
    // let hecgohmValue = BigDecimal.fromString("0")
    // let hecgohmRFV = BigDecimal.fromString("0")
    // let hecgohmPOL = BigDecimal.fromString('0')
    // if (blockNumber.gt(BigInt.fromString(SPIRIT_HECGOHM_PAIR_BLOCK))) {
    //     let hecgohmBalance = hecgohmPair.balanceOf(Address.fromString(TREASURY_ADDRESS))
    //     let hecgohmTotalLP = toDecimal(hecgohmPair.totalSupply(), 18)
    //     let hecgohmReserves = getHECGOHMReserves(hecgohmPair)
    //     hecgohmPOL = toDecimal(hecgohmBalance, 18).div(hecgohmTotalLP).times(BigDecimal.fromString('100'))
    //     hecgohmValue = getPairUSD(hecgohmBalance, hecgohmTotalLP, hecgohmReserves, hecusdRate, getGOHMUSDRate())
    //     hecgohmRFV = getDiscountedPairUSD(hecgohmBalance, hecgohmTotalLP, hecgohmReserves, BigDecimal.fromString('48')) // NOTE: There is no way to get OHM index on other chains :(
    // }

    // let daiInvestments = BigDecimal.fromString('0')
    // let usdcInvestments = BigDecimal.fromString('0')
    // let investments = BigDecimal.fromString('0')
    // if (blockNumber.gt(BigInt.fromString(CURVE_GAUGE_ALLOCATOR_CONTRACT_BLOCK))) {
    //     let curveGauge = CurveGaugeAllocator.bind(Address.fromString(CURVE_GAUGE_ALLOCATOR_CONTRACT))
    //     daiInvestments = toDecimal(curveGauge.tokenInfo(Address.fromString(ERC20DAI_CONTRACT)).value3, 18)
    //     usdcInvestments = toDecimal(curveGauge.tokenInfo(Address.fromString(USDC_ERC20_CONTRACT)).value3, 6)
    //     investments = daiInvestments.plus(usdcInvestments)
    // }

    // let stableValueDecimal = toDecimal(daiBalance, 18)
    //     .plus(toDecimal(usdcBalance, 6))
    //     .plus(toDecimal(mimBalance, 18))
    //     .plus(toDecimal(fraxBalance, 18))
    //     .plus(investments)

    // let lpValue = hecdaiValue.plus(hecusdcValue).plus(hecfraxValue).plus(hecgohmValue)
    let lpValue = hecdaiValue
    // let rfvLpValue = hecdaiRFV.plus(hecusdcRFV).plus(hecfraxRFV).plus(hecgohmRFV)
    let rfvLpValue = hecdaiRFV

    // let mv = stableValueDecimal.plus(lpValue).plus(wftmValue)
    let mv = lpValue.plus(wftmValue)
    // let rfv = stableValueDecimal.plus(rfvLpValue)
    let rfv = rfvLpValue

    log.debug("Treasury Market Value {}", [mv.toString()])
    log.debug("Treasury RFV {}", [rfv.toString()])
    // log.debug("Treasury Investments {}", [investments.toString()])
    log.debug("Treasury DAI value {}", [toDecimal(daiBalance, 18).toString()])
    log.debug("Treasury USDC value {}", [toDecimal(usdcBalance, 6).toString()])
    log.debug("Treasury MIM value {}", [toDecimal(mimBalance, 18).toString()])
    log.debug("Treasury FRAX value {}", [toDecimal(fraxBalance, 18).toString()])
    // log.debug("Treasury WFTM value {}", [wftmValue.toString()])
    log.debug("Treasury HEC-DAI RFV {}", [hecdaiRFV.toString()])
    // log.debug("Treasury HEC-USDC RFV {}", [hecusdcRFV.toString()])
    // log.debug("Treasury HEC-FRAX RFV {}", [hecfraxRFV.toString()])
    // log.debug("Treasury HEC-GOHM RFV {}", [hecgohmRFV.toString()])

    return [
        mv,
        rfv,
        // treasuryDaiRiskFreeValue = DAI RFV + DAI
        hecdaiRFV.plus(toDecimal(daiBalance, 18)),
        // treasuryUsdcRiskFreeValue = USDC RFV + USDC        
        // treasuryDaiMarketValue = DAI LP + DAI
        hecdaiValue.plus(toDecimal(daiBalance, 18)),
        // treasuryUsdcMarketValue = USDC LP + USDC     
        wftmValue,
        wftmValue,
        toDecimal(mimBalance, 18),
        toDecimal(mimBalance, 18),
        // treasuryFraxMarketValue = Frax LP + FRAX        
        // treasuryFraxRiskFreeValue = FRAX RFV + FRAX                
        // POL                       
        // Investing
        
        // Jay Commented Variable
                
        // hecfraxValue.plus(toDecimal(fraxBalance, 18)), 
        // hecfraxRFV.plus(toDecimal(fraxBalance, 18)), 
        hecdaiPOL,
        // hecfraxPOL,
        // hecusdcRFV.plus(toDecimal(usdcBalance, 6)).plus(usdcInvestments),
        // hecusdcValue.plus(toDecimal(usdcBalance, 6)).plus(usdcInvestments), 
        // hecusdcPOL, 
        // hecgohmValue,
        // hecgohmRFV,
        // hecdaiRFV.plus(toDecimal(daiBalance, 18)).plus(daiInvestments),
        // hecdaiValue.plus(toDecimal(daiBalance, 18)).plus(daiInvestments),
        // investments,
    ]
}

function getNextHECRebase(blockNumber: BigInt): BigDecimal {
    let staking_contract_v1 = HectorStaking.bind(Address.fromString(STAKING_CONTRACT_V1))
    let distribution_v1 = toDecimal(staking_contract_v1.epoch().value3, 9)
    log.debug("next_distribution v1 {}", [distribution_v1.toString()])
    let next_distribution = distribution_v1

    // if (blockNumber.gt(BigInt.fromString(STAKING_CONTRACT_V2_BLOCK))) {
    //     let staking_contract_v2 = HectorStaking.bind(Address.fromString(STAKING_CONTRACT_V2))
    //     let distribution_v2 = toDecimal(staking_contract_v2.epoch().value3, 9)
    //     log.debug("next_distribution v2 {}", [distribution_v2.toString()])
    //     next_distribution = next_distribution.plus(distribution_v2)
    // }

    log.debug("next_distribution total {}", [next_distribution.toString()])

    return next_distribution
}

function getAPY_Rebase(sHEC: BigDecimal, distributedHEC: BigDecimal): BigDecimal[] {
    let nextEpochRebase = sHEC.gt(BigDecimal.fromString('0'))
        ? distributedHEC.div(sHEC).times(BigDecimal.fromString("100"))
        : BigDecimal.fromString('0');

    let nextEpochRebase_number = parseFloat(nextEpochRebase.toString())
    let currentAPY = Math.pow(((Math.min(90, nextEpochRebase_number) / 100) + 1), (365 * 3) - 1) * 100

    let currentAPYdecimal = BigDecimal.fromString(currentAPY.toString())

    log.debug("next_rebase {}", [nextEpochRebase.toString()])
    log.debug("current_apy total {}", [currentAPYdecimal.toString()])

    return [currentAPYdecimal, nextEpochRebase]
}

function getRunway(sHec: BigDecimal, rfv: BigDecimal, rebase: BigDecimal): BigDecimal[] {
    let runwayCurrent = BigDecimal.fromString("0")
    let runway2dot5k = BigDecimal.fromString('0')
    let runway5k = BigDecimal.fromString('0')
    let runway7dot5k = BigDecimal.fromString('0')
    let runway10k = BigDecimal.fromString('0')
    let runway20k = BigDecimal.fromString('0')
    let runway50k = BigDecimal.fromString('0')
    let runway70k = BigDecimal.fromString('0')
    let runway100k = BigDecimal.fromString('0')
    if (sHec.gt(BigDecimal.fromString("0")) && rfv.gt(BigDecimal.fromString("0")) && rebase.gt(BigDecimal.fromString("0"))) {
        let treasury_runway = parseFloat(rfv.div(sHec).toString())
        let runway2dot5k_num =
            Math.log(treasury_runway) / Math.log(1 + 0.0029438) / 3
        let runway5k_num = Math.log(treasury_runway) / Math.log(1 + 0.003579) / 3
        let runway7dot5k_num =
            Math.log(treasury_runway) / Math.log(1 + 0.0039507) / 3
        let runway10k_num = Math.log(treasury_runway) / Math.log(1 + 0.00421449) / 3
        let runway20k_num = Math.log(treasury_runway) / Math.log(1 + 0.00485037) / 3
        let runway50k_num = Math.log(treasury_runway) / Math.log(1 + 0.00569158) / 3
        let runway70k_num = Math.log(treasury_runway) / Math.log(1 + 0.00600065) / 3
        let runway100k_num =
            Math.log(treasury_runway) / Math.log(1 + 0.00632839) / 3
        let nextEpochRebase_number = parseFloat(rebase.toString()) / 100
        let runwayCurrent_num = (Math.log(treasury_runway) / Math.log(1 + nextEpochRebase_number)) / 3;


        runway2dot5k = BigDecimal.fromString(runway2dot5k_num.toString())
        runway5k = BigDecimal.fromString(runway5k_num.toString())
        runway7dot5k = BigDecimal.fromString(runway7dot5k_num.toString())
        runway10k = BigDecimal.fromString(runway10k_num.toString())
        runway20k = BigDecimal.fromString(runway20k_num.toString())
        runway50k = BigDecimal.fromString(runway50k_num.toString())
        runway70k = BigDecimal.fromString(runway70k_num.toString())
        runway100k = BigDecimal.fromString(runway100k_num.toString())
        runwayCurrent = BigDecimal.fromString(runwayCurrent_num.toString())
    }

    return [
        runway2dot5k,
        runway5k,
        runway7dot5k,
        runway10k,
        runway20k,
        runway50k,
        runway70k,
        runway100k,
        runwayCurrent
    ]
}


export function updateProtocolMetrics(blockNumber: BigInt, timestamp: BigInt): void {
    let pm = loadOrCreateProtocolMetric(blockNumber, timestamp);

    //Total Supply
    pm.totalSupply = getTotalSupply()

    //Circ Supply
    pm.hecCirculatingSupply = getCriculatingSupply(blockNumber, pm.totalSupply)

    //sHec Supply
    pm.sHecCirculatingSupply = getShecSupply(blockNumber)

    //HEC Price
    pm.hecPrice = getHECUSDRate()
   

    //HEC Market Cap
    pm.marketCap = pm.hecCirculatingSupply.times(pm.hecPrice)

    //Total Value Locked
    pm.totalValueLocked = pm.sHecCirculatingSupply.times(pm.hecPrice)

    //Treasury RFV and MV
    let mv_rfv = getMV_RFV(blockNumber)
    pm.treasuryMarketValue = mv_rfv[0]
    pm.treasuryRiskFreeValue = mv_rfv[1]
    pm.treasuryDaiRiskFreeValue = mv_rfv[2]
    // pm.treasuryUsdcRiskFreeValue = mv_rfv[3]
    pm.treasuryDaiMarketValue = mv_rfv[3]
    // pm.treasuryUsdcMarketValue = mv_rfv[5]
    pm.treasuryWFTMRiskFreeValue = mv_rfv[4]
    pm.treasuryWFTMMarketValue = mv_rfv[5]
    pm.treasuryMIMRiskFreeValue = mv_rfv[6]
    pm.treasuryMIMMarketValue = mv_rfv[7]
    pm.treasuryHecDaiPOL = mv_rfv[8]

    //Extra Value 
    // pm.treasuryFRAXMarketValue = mv_rfv[10]
    // pm.treasuryFRAXRiskFreeValue = mv_rfv[11]
    // pm.treasuryGOHMMarketValue = mv_rfv[12]
    // pm.treasuryGOHMRiskFreeValue = mv_rfv[13]
    
    // pm.treasuryHecUsdcPOL = mv_rfv[15]
    // pm.treasuryHecFraxPOL = mv_rfv[16]
    // pm.treasuryInvestments = mv_rfv[17]

    // Rebase rewards, APY, rebase
    pm.nextDistributedHec = getNextHECRebase(blockNumber)
    let apy_rebase = getAPY_Rebase(pm.sHecCirculatingSupply, pm.nextDistributedHec)
    pm.currentAPY = apy_rebase[0]
    pm.nextEpochRebase = apy_rebase[1]

    //Runway
    // pm.runwayCurrent = getRunway(pm.sHecCirculatingSupply, pm.treasuryRiskFreeValue, pm.nextEpochRebase)
    let runways = getRunway(
        pm.sHecCirculatingSupply,
        pm.treasuryRiskFreeValue,
        pm.nextEpochRebase,
      )
      pm.runway2dot5k = runways[0]
      pm.runway5k = runways[1]
      pm.runway7dot5k = runways[2]
      pm.runway10k = runways[3]
      pm.runway20k = runways[4]
      pm.runway50k = runways[5]
      pm.runway70k = runways[6]
      pm.runway100k = runways[7]
      pm.runwayCurrent = runways[8]

    pm.save()
}

export function handleBlock(block: ethereum.Block): void {
    let lastBlock = LastBlock.load('0')
    if (lastBlock == null || block.number.minus(lastBlock.number).gt(BigInt.fromString('300'))) {
        lastBlock = new LastBlock('0')
        lastBlock.number = block.number
        lastBlock.timestamp = block.timestamp
        lastBlock.save()
        updateProtocolMetrics(block.number, block.timestamp)
    }
}

import React, { useEffect, useCallback, useState, useMemo, useRef } from 'react'
import { Route, useRouteMatch, useLocation } from 'react-router-dom'
import { useAppDispatch } from 'state'
import '../Home/Home.css'
import BigNumber from 'bignumber.js'
import { useWeb3React } from '@web3-react/core'
import { Image, Heading, RowType, Toggle, Text } from '@pancakeswap/uikit'
import styled from 'styled-components'
import FlexLayout from 'components/layout/Flex'
import Page from 'components/layout/Page'
import { useFarms, usePriceCakeBusd, useGetApiPrices } from 'state/hooks'
import useRefresh from 'hooks/useRefresh'
import { fetchFarmUserDataAsync } from 'state/actions'
import usePersistState from 'hooks/usePersistState'
import { Farm } from 'state/types'
import { useTranslation } from 'contexts/Localization'
import { getBalanceNumber } from 'utils/formatBalance'
import { getFarmApr } from 'utils/apr'
import { orderBy } from 'lodash'
import { getAddress } from 'utils/addressHelpers'
import isArchivedPid from 'utils/farmHelpers'
import { latinise } from 'utils/latinise'

import PageHeader from 'components/PageHeader'
import { fetchFarmsPublicDataAsync, setLoadArchivedFarmsData } from 'state/farms'
import Select, { OptionProps } from 'components/Select/Select'
import FarmCard, { FarmWithStakedValue } from './components/FarmCard/FarmCard'
import Table from './components/FarmTable/FarmTable'
import FarmTabButtons from './components/FarmTabButtons'
import SearchInput from './components/SearchInput'
import { RowProps } from './components/FarmTable/Row'
import ToggleView from './components/ToggleView/ToggleView'
import { DesktopColumnSchema, ViewMode } from './components/types'

const ControlContainer = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  position: relative;

  justify-content: space-between;
  flex-direction: column;
  margin-bottom: 32px;

  ${({ theme }) => theme.mediaQueries.sm} {
    flex-direction: row;
    flex-wrap: wrap;
    padding: 16px 32px;
    margin-bottom: 0;
  }
`

const ToggleWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-left: 10px;

  ${Text} {
    margin-left: 8px;
  }
`

const LabelWrapper = styled.div`
  > ${Text} {
    font-size: 12px;
  }
`

const FilterContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 0px;

  ${({ theme }) => theme.mediaQueries.sm} {
    width: auto;
    padding: 0;
  }
`

const ViewControls = styled.div`
  flex-wrap: wrap;
  justify-content: space-between;
  display: flex;
  align-items: center;
  width: 100%;

  > div {
    padding: 8px 0px;
  }

  ${({ theme }) => theme.mediaQueries.sm} {
    justify-content: flex-start;
    width: auto;

    > div {
      padding: 0;
    }
  }
`

const BannerImage = styled.image`
background-image: url('/images/HomeBanner.svg');
align-items: center;
background-repeat: no-repeat;
background-position: top center;
display: flex;
justify-content: center;
flex-direction: column;
margin: auto;
margin-bottom: 32px;
padding-top: 116px;
text-align: center;
`
const TopTokens = styled.div`
flex-direction:row;
justify-content:space-between;
display:flex;

`
const TopTokenText = styled.p`
color:#9B2244
`
const SeeAllBtn = styled.image`
background-image: url('/images/SeeAll.svg');
height:50px;
width:100px;
background-repeat: no-repeat;
`
const StyledImage = styled(Image)`
  margin-left: auto;
  margin-right: auto;
  margin-top: 58px;
`
const NUMBER_OF_FARMS_VISIBLE = 12
const FormDataArray = [
  {
    id: 1,
    NameData: 'Name',
    symbolData: "Symbol",
    ligquipied: 'Liquidity',
    volData: 'Volume (24hrs)',
    priceData: 'Price',
    priceChange: 'Price Change(24 hr)',
  },
  {
    id: 2,
    NameData: 'BUSD Token',
    symbolData: "BUSD",
    ligquipied: '$234,232,523',
    volData: '$543,443,543',
    priceData: '$233,543',
    priceChange: '-2.23%',
  },
  {
    id: 3,
    NameData: 'BUSD Token',
    symbolData: "BUSD",
    ligquipied: '$234,232,523',
    volData: '$543,443,543',
    priceData: '$233,543',
    priceChange: '-2.23%',
  },
  {
    id: 3,
    NameData: 'BUSD Token',
    symbolData: "BUSD",
    ligquipied: '$234,232,523',
    volData: '$543,443,543',
    priceData: '$233,543',
    priceChange: '-2.23%',
  },
  {
    id: 4,
    NameData: 'BUSD Token',
    symbolData: "BUSD",
    ligquipied: '$234,232,523',
    volData: '$543,443,543',
    priceData: '$233,543',
    priceChange: '-2.23%',
  },
  {
    id: 5,
    NameData: 'BUSD Token',
    symbolData: "BUSD",
    ligquipied: '$234,232,523',
    volData: '$543,443,543',
    priceData: '$233,543',
    priceChange: '-2.23%',
  },
  {
    id: 6,
    NameData: 'BUSD Token',
    symbolData: "BUSD",
    ligquipied: '$224,212,723',
    volData: '$542,443,553',
    priceData: '$633,523',
    priceChange: '-2.33%',
  },
  {
    id: 7,
    NameData: 'BUSD Token',
    symbolData: "BUSD",
    ligquipied: '$134,232,523',
    volData: '$593,443,543',
    priceData: '$243,543',
    priceChange: '-6.23%',
  },
  {
    id: 8,
    NameData: 'BUSD Token',
    symbolData: "BUSD",
    ligquipied: '$214,232,523',
    volData: '$513,443,543',
    priceData: '$233,543',
    priceChange: '-4.23%',
  },
]
const Farms: React.FC = () => {
  const { path } = useRouteMatch()
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const { data: farmsLP, userDataLoaded } = useFarms()
  const cakePrice = usePriceCakeBusd()
  const [query, setQuery] = useState('')
  const [viewMode, setViewMode] = usePersistState(ViewMode.TABLE, 'pancake_farm_view')
  const { account } = useWeb3React()
  const [sortOption, setSortOption] = useState('hot')
  const prices = useGetApiPrices()

  const dispatch = useAppDispatch()
  const { fastRefresh } = useRefresh()
  useEffect(() => {
    if (account) {
      dispatch(fetchFarmUserDataAsync(account))
    }
  }, [account, dispatch, fastRefresh])

  const isArchived = pathname.includes('archived')
  const isInactive = pathname.includes('history')
  const isActive = !isInactive && !isArchived

  // Users with no wallet connected should see 0 as Earned amount
  // Connected users should see loading indicator until first userData has loaded
  const userDataReady = !account || (!!account && userDataLoaded)

  const [stakedOnly, setStakedOnly] = useState(!isActive)
  useEffect(() => {
    setStakedOnly(!isActive)
  }, [isActive])

  useEffect(() => {
    // Makes the main scheduled fetching to request archived farms data
    dispatch(setLoadArchivedFarmsData(isArchived))

    // Immediately request data for archived farms so users don't have to wait
    // 60 seconds for public data and 10 seconds for user data
    if (isArchived) {
      dispatch(fetchFarmsPublicDataAsync())
      if (account) {
        dispatch(fetchFarmUserDataAsync(account))
      }
    }
  }, [isArchived, dispatch, account])

  const activeFarms = farmsLP.filter((farm) => farm.pid !== 0 && farm.multiplier !== '0X' && !isArchivedPid(farm.pid))
  const inactiveFarms = farmsLP.filter((farm) => farm.pid !== 0 && farm.multiplier === '0X' && !isArchivedPid(farm.pid))
  const archivedFarms = farmsLP.filter((farm) => isArchivedPid(farm.pid))

  const stakedOnlyFarms = activeFarms.filter(
    (farm) => farm.userData && new BigNumber(farm.userData.stakedBalance).isGreaterThan(0),
  )

  const stakedInactiveFarms = inactiveFarms.filter(
    (farm) => farm.userData && new BigNumber(farm.userData.stakedBalance).isGreaterThan(0),
  )

  const stakedArchivedFarms = archivedFarms.filter(
    (farm) => farm.userData && new BigNumber(farm.userData.stakedBalance).isGreaterThan(0),
  )

  const farmsList = useCallback(
    (farmsToDisplay: Farm[]): FarmWithStakedValue[] => {
      let farmsToDisplayWithAPR: FarmWithStakedValue[] = farmsToDisplay.map((farm) => {
        if (!farm.lpTotalInQuoteToken || !prices) {
          return farm
        }

        const quoteTokenPriceUsd = prices[getAddress(farm.quoteToken.address).toLowerCase()]
        const totalLiquidity = new BigNumber(farm.lpTotalInQuoteToken).times(quoteTokenPriceUsd)
        const apr = isActive ? getFarmApr(farm.poolWeight, cakePrice, totalLiquidity) : 0

        return { ...farm, apr, liquidity: totalLiquidity }
      })

      if (query) {
        const lowercaseQuery = latinise(query.toLowerCase())
        farmsToDisplayWithAPR = farmsToDisplayWithAPR.filter((farm: FarmWithStakedValue) => {
          return latinise(farm.lpSymbol.toLowerCase()).includes(lowercaseQuery)
        })
      }
      return farmsToDisplayWithAPR
    },
    [cakePrice, prices, query, isActive],
  )

  const handleChangeQuery = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value)
  }

  const loadMoreRef = useRef<HTMLDivElement>(null)


  return (
    <>

      <Page>
        <BannerImage />

        <TopTokens>
          <TopTokenText>{t('Top tokens')}</TopTokenText>
          <SeeAllBtn />
        </TopTokens>
 
        {/* <div style={{ justifyContent: 'space-between', display: 'flex' }}>
          <span style={{ color: '#9B2244' }}>Top tokens</span>

          <SeeAllBtn />
        </div> */}
        {
          FormDataArray.map((row) => {
            return (
              <div>
                <table id='students'>
                  <tbody>
                    {/* <tr>{this.renderTableHeader()}</tr> */}
                    {
                      row.id === 1 ?
                        <tr key={row.id}>
                          <td style={{ color: '#9B2244' }}>{row.NameData}</td>
                          <td style={{ color: '#9B2244' }}>{row.symbolData}</td>
                          <td style={{ color: '#9B2244' }}>{row.ligquipied}</td>
                          <td style={{ color: '#9B2244' }}>{row.volData}</td>
                          <td style={{ color: '#9B2244' }}>{row.priceData}</td>
                          <td style={{ color: '#9B2244' }}>{row.priceChange}</td>
                        </tr> :
                        <tr key={row.id}>
                          <td style={{ color: '#444241', fontWeight: 'bold', fontSize: 14 }}>{row.NameData}</td>
                          <td style={{ color: '#444241', fontSize: 12 }}>{row.symbolData}</td>
                          <td style={{ color: '#444241', fontSize: 12 }}>{row.ligquipied}</td>
                          <td style={{ color: '#444241', fontSize: 12 }}>{row.volData}</td>
                          <td style={{ color: '#444241', fontSize: 12 }}>{row.priceData}</td>
                          <td style={{ color: '#444241', fontSize: 12 }}>{row.priceChange}</td>
                        </tr>

                    }

                  </tbody>
                </table>
              </div>
            )
          })
        }
        <div ref={loadMoreRef} />
        {/* <StyledImage src="/images/3dpan.png" alt="Pancake illustration" width={120} height={103} /> */}
      </Page>
    </>
  )
}

export default Farms

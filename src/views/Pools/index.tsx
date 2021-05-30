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
import FarmCard, { FarmWithStakedValue } from '../Farms/components/FarmCard/FarmCard'
import Table from '../Farms/components/FarmTable/FarmTable'
import FarmTabButtons from '../Farms/components/FarmTabButtons'
import SearchInput from '../Farms/components/SearchInput'
import { RowProps } from '../Farms/components/FarmTable/Row'
import ToggleView from '../Farms/components/ToggleView/ToggleView'
import { DesktopColumnSchema, ViewMode } from '../Farms/components/types'

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

const TopPairs = styled.image`
background-image: url('/images/TopPairs.svg');
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

const TransectionBanner = styled.image`
background-image: url('/images/TransectionBanner.svg');
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
const Pools: React.FC = () => {
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

  const [numberOfFarmsVisible, setNumberOfFarmsVisible] = useState(NUMBER_OF_FARMS_VISIBLE)
  const [observerIsSet, setObserverIsSet] = useState(false)

  const farmsStakedMemoized = useMemo(() => {
    let farmsStaked = []

    const sortFarms = (farms: FarmWithStakedValue[]): FarmWithStakedValue[] => {
      switch (sortOption) {
        case 'apr':
          return orderBy(farms, (farm: FarmWithStakedValue) => farm.apr, 'desc')
        case 'multiplier':
          return orderBy(
            farms,
            (farm: FarmWithStakedValue) => (farm.multiplier ? Number(farm.multiplier.slice(0, -1)) : 0),
            'desc',
          )
        case 'earned':
          return orderBy(
            farms,
            (farm: FarmWithStakedValue) => (farm.userData ? Number(farm.userData.earnings) : 0),
            'desc',
          )
        case 'liquidity':
          return orderBy(farms, (farm: FarmWithStakedValue) => Number(farm.liquidity), 'desc')
        default:
          return farms
      }
    }

    if (isActive) {
      farmsStaked = stakedOnly ? farmsList(stakedOnlyFarms) : farmsList(activeFarms)
    }
    if (isInactive) {
      farmsStaked = stakedOnly ? farmsList(stakedInactiveFarms) : farmsList(inactiveFarms)
    }
    if (isArchived) {
      farmsStaked = stakedOnly ? farmsList(stakedArchivedFarms) : farmsList(archivedFarms)
    }

    return sortFarms(farmsStaked).slice(0, numberOfFarmsVisible)
  }, [
    sortOption,
    activeFarms,
    farmsList,
    inactiveFarms,
    archivedFarms,
    isActive,
    isInactive,
    isArchived,
    stakedArchivedFarms,
    stakedInactiveFarms,
    stakedOnly,
    stakedOnlyFarms,
    numberOfFarmsVisible,
  ])

  useEffect(() => {
    const showMoreFarms = (entries) => {
      const [entry] = entries
      if (entry.isIntersecting) {
        setNumberOfFarmsVisible((farmsCurrentlyVisible) => farmsCurrentlyVisible + NUMBER_OF_FARMS_VISIBLE)
      }
    }

    if (!observerIsSet) {
      const loadMoreObserver = new IntersectionObserver(showMoreFarms, {
        rootMargin: '0px',
        threshold: 1,
      })
      loadMoreObserver.observe(loadMoreRef.current)
      setObserverIsSet(true)
    }
  }, [farmsStakedMemoized, observerIsSet])

  const rowData = farmsStakedMemoized.map((farm) => {
    const { token, quoteToken } = farm
    const tokenAddress = token.address
    const quoteTokenAddress = quoteToken.address
    const lpLabel = farm.lpSymbol && farm.lpSymbol.split(' ')[0].toUpperCase().replace('PANCAKE', '')

    const row: RowProps = {
      apr: {
        value: farm.apr && farm.apr.toLocaleString('en-US', { maximumFractionDigits: 2 }),
        multiplier: farm.multiplier,
        lpLabel,
        tokenAddress,
        quoteTokenAddress,
        cakePrice,
        originalValue: farm.apr,
      },
      farm: {
        image: farm.lpSymbol.split(' ')[0].toLocaleLowerCase(),
        label: lpLabel,
        pid: farm.pid,
      },
      earned: {
        earnings: getBalanceNumber(new BigNumber(farm.userData.earnings)),
        pid: farm.pid,
      },
      liquidity: {
        liquidity: farm.liquidity,
      },
      multiplier: {
        multiplier: farm.multiplier,
      },
      details: farm,
    }

    return row
  })

  const renderContent = (): JSX.Element => {
    if (viewMode === ViewMode.TABLE && rowData.length) {
      const columnSchema = DesktopColumnSchema

      const columns = columnSchema.map((column) => ({
        id: column.id,
        name: column.name,
        label: column.label,
        sort: (a: RowType<RowProps>, b: RowType<RowProps>) => {
          switch (column.name) {
            case 'farm':
              return b.id - a.id
            case 'apr':
              if (a.original.apr.value && b.original.apr.value) {
                return Number(a.original.apr.value) - Number(b.original.apr.value)
              }

              return 0
            case 'earned':
              return a.original.earned.earnings - b.original.earned.earnings
            default:
              return 1
          }
        },
        sortable: column.sortable,
      }))

      return <Table data={rowData} columns={columns} userDataReady={userDataReady} />
    }

    return (
      <div>
        <FlexLayout>
          <Route exact path={`${path}`}>
            {farmsStakedMemoized.map((farm) => (
              <FarmCard key={farm.pid} farm={farm} cakePrice={cakePrice} account={account} removed={false} />
            ))}
          </Route>
          <Route exact path={`${path}/history`}>
            {farmsStakedMemoized.map((farm) => (
              <FarmCard key={farm.pid} farm={farm} cakePrice={cakePrice} account={account} removed />
            ))}
          </Route>
          <Route exact path={`${path}/archived`}>
            {farmsStakedMemoized.map((farm) => (
              <FarmCard key={farm.pid} farm={farm} cakePrice={cakePrice} account={account} removed />
            ))}
          </Route>
        </FlexLayout>
      </div>
    )
  }

  const handleSortOptionChange = (option: OptionProps): void => {
    setSortOption(option.value)
  }

  return (
    <>
      <Page>

        <TopPairs />
        <TopTokens>
          <TopTokenText>{t('Top Pairs')}</TopTokenText>
          <SeeAllBtn />
        </TopTokens>
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

        {/* {renderContent()} */}
        <div ref={loadMoreRef} />

      </Page>
    </>
  )
}


export default Pools

// import React from 'react'
// import styled from 'styled-components'
// import { Heading, Text, BaseLayout, BackgroundImage } from '@pancakeswap/uikit'
// import { useTranslation } from 'contexts/Localization'
// import Page from 'components/layout/Page'
// import FarmStakingCard from 'views/Home/components/FarmStakingCard'
// import LotteryCard from 'views/Home/components/LotteryCard'
// import CakeStats from 'views/Home/components/CakeStats'
// import TotalValueLockedCard from 'views/Home/components/TotalValueLockedCard'
// import EarnAPRCard from 'views/Home/components/EarnAPRCard'
// import EarnAssetCard from 'views/Home/components/EarnAssetCard'
// import WinCard from 'views/Home/components/WinCard'
// import Table, { ColumnDefinitionType } from './components/Table'

// interface Cat {
//   name: string;
//   age: number;
//   gender: string;
//   color: string;
//   activityLevel?: string; // optional, same as string | undefined
//   favoriteFood?: string;  // optional, same as string | undefined
// }
// const data: Cat[] = [
//   {
//     name: 'Mittens',
//     color: 'black',
//     age: 2,
//     gender: 'female',
//     activityLevel: 'hight',
//     favoriteFood: 'milk'
//   },
//   {
//     name: 'Mons',
//     color: 'grey',
//     age: 2,
//     gender: 'male',
//     favoriteFood: 'old socks',
//     activityLevel: 'medium'
//   },
//   {
//     name: 'Luna',
//     color: 'black',
//     age: 2,
//     gender: 'female',
//     activityLevel: 'medium',
//     favoriteFood: 'fish'
//   },
//   {
//     name: 'Bella',
//     color: 'grey',
//     age: 1,
//     gender: 'female',
//     activityLevel: 'high',
//     favoriteFood: 'mice'
//   },
//   {
//     name: 'Oliver',
//     color: 'orange',
//     age: 1,
//     gender: 'male',
//     activityLevel: 'low',
//     favoriteFood: 'fish'
//   }
// ]

// const columns: ColumnDefinitionType<Cat, keyof Cat>[] = [
//   {
//     key: 'name',
//     header: 'Name',
//     width: 150
//   },
//   {
//     key: 'age',
//     header: 'Age in years',
//   },
//   {
//     key: 'color',
//     header: 'Color'
//   }
// ]

// const Hero = styled.div`
//   align-items: center;
//   background-image: url('/images/pan-bg-mobile.svg');
//   background-repeat: no-repeat;
//   background-position: top center;
//   display: flex;
//   justify-content: center;
//   flex-direction: column;
//   margin: auto;
//   margin-bottom: 32px;
//   padding-top: 116px;
//   text-align: center;

//   ${({ theme }) => theme.mediaQueries.lg} {
//     background-image: url('/images/pan-bg2.svg'), url('/images/pan-bg.svg');
//     background-position: left center, right center;
//     height: 165px;
//     padding-top: 0;
//   }
// `

// const Cards = styled(BaseLayout)`
//   align-items: stretch;
//   justify-content: stretch;
//   margin-bottom: 24px;
//   grid-gap: 24px;

//   & > div {
//     grid-column: span 6;
//     width: 100%;
//   }

//   ${({ theme }) => theme.mediaQueries.sm} {
//     & > div {
//       grid-column: span 8;
//     }
//   }

//   ${({ theme }) => theme.mediaQueries.lg} {
//     margin-bottom: 32px;
//     grid-gap: 32px;

//     & > div {
//       grid-column: span 6;
//     }
//   }
// `

// const CTACards = styled(BaseLayout)`
//   align-items: start;
//   margin-bottom: 24px;
//   grid-gap: 24px;

//   & > div {
//     grid-column: span 6;
//   }

//   ${({ theme }) => theme.mediaQueries.sm} {
//     & > div {
//       grid-column: span 8;
//     }
//   }

//   ${({ theme }) => theme.mediaQueries.lg} {
//     margin-bottom: 32px;
//     grid-gap: 32px;

//     & > div {
//       grid-column: span 4;
//     }
//   }
// `

// const Image = styled.image`
// background-image: url('/images/HomeBanner.svg');
// align-items: center;
// background-repeat: no-repeat;
// background-position: top center;
// display: flex;
// justify-content: center;
// flex-direction: column;
// margin: auto;
// margin-bottom: 32px;
// padding-top: 116px;
// text-align: center;
// `
// const TopTokens = styled.div`
// flex-direction:row;
// justify-content:space-between;
// display:flex;

// `
// const TopTokenText = styled.p`
// color:#9B2244
// `
// const SeeAllBtn = styled.image`
// background-image: url('/images/SeeAll.svg');
// height:50px;
// width:100px;
// background-repeat: no-repeat;
// `

// const Home: React.FC = () => {
//   const { t } = useTranslation()

//   return (
//     <Page>
//       <Hero>
//         <Heading as="h1" scale="xl" mb="24px" color="secondary">
//           {t('PancakeSwap')}
//         </Heading>
//         <Text>{t('The #1 AMM and yield farm on Binance Smart Chain.')}</Text>

//       </Hero>

//       <Image />

//       <TopTokens>
//         <TopTokenText>{t('Top tokens')}</TopTokenText>

//         <SeeAllBtn />
//       </TopTokens>
//       <Table data={data} columns={columns} />
//       {/* <div>
//         <Cards>
//           <FarmStakingCard />
//           <LotteryCard />
//         </Cards>
//         <CTACards>
//           <EarnAPRCard />
//           <EarnAssetCard />
//           <WinCard />
//         </CTACards>
//         <Cards>
//           <CakeStats />
//           <TotalValueLockedCard />
//         </Cards>
//       </div> */}
//     </Page>
//   )
// }

// export default Home

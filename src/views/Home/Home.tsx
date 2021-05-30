import React, { useEffect, useCallback, useState, useMemo, useRef } from 'react'
import { Route, useRouteMatch, useLocation } from 'react-router-dom'
import { useAppDispatch } from 'state'
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
import './Home.css'
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

const ChartOne = styled.image`
background-image: url('/images/charttwo.svg');
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
flex:1;

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

const DivTwo = styled.div`
display:block;
flex-direction:row;
background-color:red;
width:100%;
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
const Home: React.FC = () => {
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
  return (
    <Page>
      {/* <div> */}

      {/* </div> */}



      <div>
      {/* <ChartOne /> */}
    
        <BannerImage />
        <div style={{ justifyContent: 'space-between', display: 'flex' }}>
          <span style={{ color: '#9B2244' }}>Top tokens</span>

          <SeeAllBtn />
        </div>
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

        <TopPairs />
        <div style={{ justifyContent: 'space-between', display: 'flex' }}>
          <TopTokenText>{t('Top Pairs')}</TopTokenText>
          <SeeAllBtn />
        </div>
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

        <TransectionBanner />
        <div style={{ justifyContent: 'space-between', display: 'flex' }}>

          <TopTokenText>{t('Top Transections')}</TopTokenText>
          <SeeAllBtn />
        </div>
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





        {/* <Page>
       
        <TopTokens>
          <TopTokenText>{t('Top tokens')}</TopTokenText>
          <SeeAllBtn />
        </TopTokens>
        {renderContent()}
        <div ref={loadMoreRef} />
        <TopPairs />
        <TopTokens>
          <TopTokenText>{t('Top Pairs')}</TopTokenText>
          <SeeAllBtn />
        </TopTokens>
        {renderContent()}
        <div ref={loadMoreRef} />

        <TransectionBanner />
        <TopTokens>
          <TopTokenText>{t('Top Transections')}</TopTokenText>
          <SeeAllBtn />
        </TopTokens>
        {renderContent()}
        <div ref={loadMoreRef} />
        <StyledImage src="/images/3dpan.png" alt="Pancake illustration" width={120} height={103} />
      </Page> */}
      </div>
    </Page>

  )
}


export default Home

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

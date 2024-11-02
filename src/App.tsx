import React, { useEffect, useState } from "react";
import "./App.css";
import ApexCharts from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const DEMO_APIKEY = "RIBXT3XYLI69PC0Q";

type MetaType = {
  information: string;
  symbol: string;
  lastRefreshed: string;
  interval: string;
  outputSize: string;
  timeZone: string;
};

type TimeSeriesElementType = {
  openStr: string;
  highStr: string;
  lowStr: string;
  closeStr: string;
  volumeStr: string;

  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

interface ISeries {
  timeStr: string;
  timeDate: Date;
  data: TimeSeriesElementType;
}

interface IIntraDay {
  metaData?: MetaType;
  timeSeries?: ISeries[];
}

type CandleStickElement = {
  x: Date;
  y: number[];
};

type CandleStickData = {
  data: CandleStickElement[];
};

class IntraDay implements IIntraDay {
  metaData?: MetaType;
  timeSeries?: ISeries[];

  constructor(metaData?: MetaType, timeSeries?: ISeries[]) {
    this.metaData = metaData;
    this.timeSeries = timeSeries;
  }

  static Parse(data: any): IntraDay | undefined {
    let metadata = data["Meta Data"];
    let series = data["Time Series (5min)"];

    try {
      let _metaData: MetaType = {
        information: metadata["1. Information"],
        symbol: metadata["2. Symbol"],
        lastRefreshed: metadata["3. Last Refreshed"],
        interval: metadata["4. Interval"],
        outputSize: metadata["5. Output Size"],
        timeZone: metadata["6. Time Zone"],
      };

      let _series = Object.keys(series).map((key) => {
        const val = series[key];
        return {
          timeStr: key,
          timeDate: new Date(key),
          data: {
            openStr: val["1. open"],
            highStr: val["2. high"],
            lowStr: val["3. low"],
            closeStr: val["4. close"],
            volumeStr: val["5. volume"],
            open: Number(val["1. open"]),
            high: Number(val["2. high"]),
            low: Number(val["3. low"]),
            close: Number(val["4. close"]),
            volume: Number(val["5. volume"]),
          },
        };
      });
      const res = new IntraDay(_metaData, _series);
      return res;
    } catch (ex) {
      return undefined;
    }
  }

  getCandleStickData(): CandleStickData[] {
    const data =
      this.timeSeries?.map((item, i) => {
        return {
          x: item.timeDate,
          y: [item.data.open, item.data.high, item.data.low, item.data.close],
        } as CandleStickElement;
      }) || [];

    return [{ data }];
  }
}

function App() {
  const [data, setData] = useState<IntraDay>();
  const [error, setError] = useState<string>();

  const fetchData = async () => {
   
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=IBM&interval=5min&apikey=${DEMO_APIKEY}`;

    try {
      const response = await fetch(url, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if(!!data?.["Information"]) {
        setError(data?.["Information"]);
        setData(undefined);
      } else {
        setError('');
        const intraDay = IntraDay.Parse(data);
        console.log({ intraDay });
        setData(intraDay);
      }
      
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const seriesData = data?.getCandleStickData();

  const options: ApexOptions = {
    chart: {
      height: 350,
    },
    xaxis: {
      type: "datetime",
    },
    yaxis: {
      tooltip: {
        enabled: true,
      },
    },
  };

  return (
    <div className="App p-10">
      <div className="max-w-[1200px] mx-auto w-full ">
        <div className="bg-white shadow-lg rounded-2xl">
          <h1 className="text-[40px] p-5">
            Test App Created By LiuQing, @axdevts
          </h1>
        </div>

        <div className="w-full text-start mt-10 bg-white shadow-lg rounded-2xl p-5">
          <div className=" my-6">
            <div className="text-[18px] font-bold mb-3">Data</div>
            {
              error && <div className="text-red-500 px-4 pb-4">{error}</div>
            }
            <div className="grid grid-cols-[3fr_2fr]">
              <div className="grid grid-cols-[1fr_3fr]">
                <div className="font-bold ">Information</div>
                <div>{data?.metaData?.information}</div>
                <div className="font-bold">Symbol</div>
                <div> {data?.metaData?.symbol}</div>
                <div className="font-bold">Last Refreshed</div>
                <div> {data?.metaData?.lastRefreshed}</div>
                <div className="font-bold">Interval</div>
                <div> {data?.metaData?.interval}</div>
                <div className="font-bold">OutputSize</div>
                <div> {data?.metaData?.outputSize}</div>
                <div className="font-bold">TimeZone</div>
                <div> {data?.metaData?.timeZone}</div>
              </div>
              <div className="data-list-container max-h-[200px] overflow-y-auto">
                {
                  seriesData?.[0].data?.map((item, i)=>{
                    return <div key={'sk_'+i} className="grid grid-cols-[2fr_3fr]">
                      <div>{item.x.toLocaleString()}</div>
                      <div>{item.y}</div>
                    </div>
                  })
                }
              </div>
            </div>
          </div>
          <div className="max-h-[600px] my-3">
            <div className="text-[18px] font-bold">Time Series Chart</div>
            <div className="">
              {seriesData && (
                <ApexCharts
                  options={options}
                  series={seriesData!}
                  type="candlestick"
                  height={350}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

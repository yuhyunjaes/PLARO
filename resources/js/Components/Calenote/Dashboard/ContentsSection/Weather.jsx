import { useState, useEffect } from "react";

export default function Weather() {
    const [weatherData, setWeatherData] = useState(null);
    const [location, setLocation] = useState({ nx: null, ny: null });
    const [error, setError] = useState(null);

    const dfs_xy_conv = (v1, v2) => {
        const RE = 6371.00877;
        const GRID = 5.0;
        const SLAT1 = 30.0;
        const SLAT2 = 60.0;
        const OLON = 126.0;
        const OLAT = 38.0;
        const XO = 43;
        const YO = 136;
        const DEGRAD = Math.PI / 180.0;
        let re = RE / GRID;
        let slat1 = SLAT1 * DEGRAD;
        let slat2 = SLAT2 * DEGRAD;
        let olon = OLON * DEGRAD;
        let olat = OLAT * DEGRAD;
        let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
        sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
        let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
        sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
        let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
        ro = re * sf / Math.pow(ro, sn);
        let ra = Math.tan(Math.PI * 0.25 + (v1) * DEGRAD * 0.5);
        ra = re * sf / Math.pow(ra, sn);
        let theta = v2 * DEGRAD - olon;
        if (theta > Math.PI) theta -= 2.0 * Math.PI;
        if (theta < -Math.PI) theta += 2.0 * Math.PI;
        theta *= sn;
        const nx = Math.floor(ra * Math.sin(theta) + XO + 0.5);
        const ny = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);
        return { nx, ny };
    };

    const getBaseDateTime = (offsetHour = 0) => {
        const now = new Date();
        now.setHours(now.getHours() + offsetHour);
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(Math.floor(now.getMinutes() / 10) * 10).padStart(2, "0");
        return { base_date: `${year}${month}${day}`, base_time: `${hours}${minutes}` };
    };

    const translateWeather = (data) => {
        const result = {};
        data.forEach((item) => {
            switch (item.category) {
                case "T1H": result.temp = `${item.obsrValue}℃`; break;
                case "REH": result.humidity = `${item.obsrValue}%`; break;
                case "WSD": result.wind = `${item.obsrValue}m/s`; break;
                case "SKY":
                    result.sky = ["", "맑음", "", "구름 많음", "흐림"][item.obsrValue] || "맑음";
                    break;
                case "PTY":
                    result.rain = ["강수 없음", "비", "비/눈", "눈", "", "빗방울", "빗방울/눈", "눈날림"][item.obsrValue] || "강수 없음";
                    break;
                default: break;
            }
        });
        if (!result.sky) result.sky = "맑음";
        if (!result.rain) result.rain = "강수 없음";
        return result;
    };

    useEffect(() => {
        const fetchWeather = async (retry = false) => {
            try {
                if (!("geolocation" in navigator)) {
                    setError("이 브라우저에서는 위치 정보가 지원되지 않습니다.");
                    return;
                }

                navigator.geolocation.getCurrentPosition(async (pos) => {
                    const { latitude, longitude } = pos.coords;
                    const { nx, ny } = dfs_xy_conv(latitude, longitude);
                    setLocation({ nx, ny });

                    const { base_date, base_time } = getBaseDateTime(retry ? -1 : 0);
                    const serviceKey = import.meta.env.VITE_WEATHER_API_KEY;
                    const url = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?serviceKey=${serviceKey}&pageNo=1&numOfRows=1000&dataType=JSON&base_date=${base_date}&base_time=${base_time}&nx=${nx}&ny=${ny}`;

                    const res = await fetch(url);
                    const data = await res.json();
                    const items = data.response?.body?.items?.item;

                    if (!items || items.length === 0) {
                        if (!retry) {
                            await fetchWeather(true);
                        } else {
                            setError("이전 시간 데이터도 불러올 수 없습니다.");
                        }
                    } else {
                        setWeatherData(items);
                    }
                });
            } catch (e) {
                setError("날씨 정보를 불러오는 중 오류가 발생했습니다.");
                console.error(e);
            }
        };

        fetchWeather();
    }, []);

    return (
        <div className="size-full flex flex-col">
            <h3 className="font-semibold mb-2 normal-text">오늘의 날씨</h3>
            {error ? (
                <p className="text-red-500 text-sm">{error}</p>
            ) : weatherData ? (
                weatherData.length > 0 ? (
                    (() => {
                        const w = translateWeather(weatherData);
                        return (
                            <div className="flex-1 normal-text flex flex-col justify-center items-center gap-1 text-sm">
                                <p className="text-5xl">
                                        {(() => {
                                            if (w.sky.includes("맑음")) return "☀️";
                                            if (w.sky.includes("구름")) return "⛅";
                                            if (w.sky.includes("흐림")) return "☁️";
                                            if (w.rain.includes("비")) return "🌧️";
                                            if (w.rain.includes("눈")) return "❄️";
                                            return "🌤️";
                                        })()}
                                </p>
                                <p className="text-lg font-semibold">{w.temp}</p>
                                <p className="flex justify-center items-center divide-x divide-gray-300 dark:divide-gray-700 text-sm">
                                    <span className="px-1 sm:px-2">{w.sky}</span>
                                    <span className="px-1 sm:px-2">{w.rain}</span>
                                    <span className="px-1 sm:px-2">습도 {w.humidity}</span>
                                    <span className="px-1 sm:px-2">풍속 {w.wind}</span>
                                </p>
                            </div>
                        );
                    })()
                ) : (
                    <p className="text-gray-400 text-sm">날씨 데이터를 불러오는 중...</p>
                )
            ) : (
                <p className="text-gray-400 text-sm">위치 정보를 가져오는 중...</p>
            )}
        </div>
    );
}

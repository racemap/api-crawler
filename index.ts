import fs from 'fs'
import fetch from 'node-fetch'

interface Current {
    time: string,
    gap: number,
}

interface Starter {
    id: string,
    name: string,
    current: Current
}

interface Response {
    starters: Array<Starter>
}

const API_CALL_1 = "https://racemap.com/api/data/v1/61a21210e5d45d000199f7d9/current?liveDelay=20&interpolation=false&currentSpeedDuration=30"
const API_CALL_2 = "https://racemap.com/api/data/v1/61a21210e5d45d000199f7d9/current?liveDelay=20&interpolation=true&currentSpeedDuration=100"
const CSV_PATH = './output.csv'
const INTERVAL_MS = 1000

const headerMap: Record<string, number> = {
    time: 0
}


function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function writeResponses(res1: Response, res2: Response) {
    const row = [new Date().toISOString()]
    for (const starter1 of res1.starters) {
        const starter2 = res2.starters.find(s => s.id === starter1.id)
        if (starter2 == null || starter1.current == null) continue

        if (headerMap[`${starter1.name}_time1`] == null) {
            headerMap[`${starter1.name}_time1`] = Object.keys(headerMap).length
            headerMap[`${starter1.name}_gap1`] = Object.keys(headerMap).length
            headerMap[`${starter2.name}_time2`] = Object.keys(headerMap).length
            headerMap[`${starter2.name}_gap2`] = Object.keys(headerMap).length
        }

        const indexGap1 = headerMap[`${starter1.name}_gap1`]
        const indexTime1 = headerMap[`${starter1.name}_time1`]
        const indexGap2 = headerMap[`${starter1.name}_gap2`]
        const indexTime2 = headerMap[`${starter1.name}_time2`]

        row[indexGap1] = starter1.current.gap.toFixed(2)
        row[indexTime1] = starter1.current.time
        row[indexGap2] = starter2.current.gap.toFixed(2)
        row[indexTime2] = starter2.current.time
    }

    if (!fs.existsSync(CSV_PATH)) {
        fs.writeFileSync(CSV_PATH, Object.keys(headerMap).join(';') + "\n", { flag: 'a' })
    }

    fs.writeFileSync(CSV_PATH, row.join(';') + "\n", { flag: 'a' })
}

async function makeApiCall(url: string) {
    const res = await fetch(url)

    return res.json()
}

async function callApi() {
    try {
        const [res1, res2] = await Promise.all([
            makeApiCall(API_CALL_1),
            makeApiCall(API_CALL_2)
        ])

        await writeResponses(res1 as Response, res2 as Response)
        console.log(`Called and store api at ${new Date().toISOString()}.`)
    } catch (error) {
        console.error(error)
    }
}

async function main() {
    while (true) {
        callApi()
        await sleep(1000)
    }
}

main()
import Teemo = require("teemojs");

export const REGIONS = ["BR", "EUNE", "EUW", "JP", "LAN", "LAS", "NA", "OCE", "TR", "RU"];

/**
 * A simple incomplete interface for the Riot Games API.
 * This only contains methods used in Orianna, and supports all platforms and rate limiting.
 */
export default class RiotAPI {
    private readonly teemo: teemo.Teemo;

    constructor(key: string) {
        this.teemo = Teemo(key);
    }

    /**
     * @returns the summoner for the specified name in the specified region, or null if not found
     */
    async getSummonerByName(region: string, name: string): Promise<riot.Summoner | null> {
        try {
            return await this.teemo.get(platform(region), "summoner.getBySummonerName", name);
        } catch (e) {
            return null;
        }
    }

    /**
     * @returns the summoner for the specified summoner id in the specified region, or null if not found
     */
    async getSummonerById(region: string, summonerId: number): Promise<riot.Summoner | null> {
        try {
            return await this.teemo.get(platform(region), "summoner.getBySummonerId", "" + summonerId);
        } catch (e) {
            return null;
        }
    }

    /**
     * @returns the champion mastery for the specified summoner id
     */
    async getChampionMastery(region: string, summonerId: number): Promise<riot.ChampionMasteryInfo[]> {
        try {
            return await this.teemo.get(platform(region), "championMastery.getAllChampionMasteries", "" + summonerId);
        } catch (e) {
            return [];
        }
    }

    /**
     * @returns all the league positions for the specified summoner id
     */
    async getLeaguePositions(region: string, summonerId: number): Promise<riot.LeagueEntry[]> {
        try {
            return await this.teemo.get(platform(region), "league.getAllLeaguePositionsForSummoner", "" + summonerId);
        } catch (e) {
            return [];
        }
    }

    /**
     * Checks if the specified summoner has the specified code as their third party code.
     */
    async isThirdPartyCode(region: string, summonerId: number, code: string): Promise<boolean> {
        try {
            const currentCode = await this.teemo.get(platform(region), "thirdPartyCode.getThirdPartyCodeBySummonerId", "" + summonerId);
            return currentCode.toLowerCase() === code.toLowerCase();
        } catch (e) {
            return false;
        }
    }
}

/**
 * @returns the platform ID for the specified region
 */
function platform(region: string): string {
    return (<{ [key: string]: string }>{
        "br": "BR1",
        "eune": "EUN1",
        "euw": "EUW1",
        "jp": "JP1",
        "kr": "KR",
        "lan": "LA1",
        "las": "LA2",
        "na": "NA1",
        "oce": "OC1",
        "tr": "TR1",
        "ru": "RU"
    })[region.toLowerCase()];
}
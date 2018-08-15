import { Model, Pojo } from "objection";
import * as decorators from "../util/objection";
import { evaluateRangeCondition, TypedRoleCondition } from "../types/conditions";
import User from "./user";
import config from "../config";
import omit = require("lodash.omit");

@decorators.table("roles")
export default class Role extends Model {
    /**
     * Unique incremented ID for this role.
     */
    readonly id: number;

    /**
     * The name for this role.
     */
    name: string;

    /**
     * The ID of the Discord role that corresponds to this role entry.
     */
    snowflake: string;

    /**
     * If users that "gain" this role should get an announcement in the server
     * announcement channel.
     */
    announce: boolean;

    /**
     * ID of the server this role belongs to.
     */
    server_id: number;

    /**
     * Optionally eager-loaded conditions.
     */
    conditions?: RoleCondition[];

    /**
     * Checks if this role should be assigned to the specified user.
     * The user must have its accounts, scores and tiers loaded already.
     */
    test(user: User): boolean {
        if (typeof this.conditions === "undefined") throw new Error("Conditions must be loaded.");
        if (!this.conditions.length) return false;

        return !this.conditions.some(x => !x.test(user));
    }

    /**
     * Finds a champion in the set of requirements for this role, to be displayed
     * in the promotion image, _if_ one exists.
     */
    findChampion(): number | null {
        if (typeof this.conditions === "undefined") throw new Error("Conditions must be loaded.");

        const cond = this.conditions.find(x => !!x.options.champion);
        return cond ? cond.options.champion : null;
    }

    /**
     * Omit server_id from the JSON object.
     */
    $formatJson(json: Pojo) {
        return omit({...super.$formatJson(json), announce: !!this.announce}, ["server_id"]);
    }
}

@decorators.table("role_conditions")
export class RoleCondition extends Model {
    /**
     * Make sure that Objection parses these as JSON objects.
     */
    static jsonAttributes = ["options"];

    /**
     * Unique incremented ID for this condition.
     */
    readonly id: number;

    /**
     * The type of this condition.
     */
    type: TypedRoleCondition["type"];

    /**
     * The metadata/options for this condition.
     */
    options: any;

    /**
     * Checks if this specific condition applies for the
     * specified user. This assumes that the user already has
     * it's mastery scores, accounts and tiers loaded.
     */
    test(user: User): boolean {
        if (typeof user.ranks === "undefined"
            || typeof user.stats === "undefined"
            || typeof user.accounts === "undefined") throw new Error("User must have all fields loaded.");

        const condition: TypedRoleCondition = <TypedRoleCondition>this;
        if (condition.type === "mastery_level") {
            // Check if we have a stats entry for the specified champion that matches the range.
            return user.stats.some(x =>
                x.champion_id === condition.options.champion
                && evaluateRangeCondition(condition.options, x.level));
        } else if (condition.type === "mastery_score") {
            // Check if we have a stats entry for the specified champion that matches the range.
            return user.stats.some(x =>
                x.champion_id === condition.options.champion
                && evaluateRangeCondition(condition.options, x.score));
        } else if (condition.type === "total_mastery_score") {
            // Sum total score, then evaluate the range condition.
            const total = user.stats.reduce((p, c) => p + c.score, 0);
            return evaluateRangeCondition(condition.options, total);
        } else if (condition.type === "ranked_tier" && condition.options.queue !== "ANY") {
            // If the user is unranked in the queue, only match if they had a condition set to `EQUAL UNRANKED` (e.g. don't include unranked in lt and gt).
            const tier = user.ranks.find(x => x.queue === condition.options.queue);
            if (!tier || user.treat_as_unranked) return condition.options.compare_type === "equal" && condition.options.tier === 0;

            const numeric = config.riot.tiers.indexOf(tier.tier) + 1;
            return condition.options.compare_type === "lower"
                ? condition.options.tier > numeric
                : condition.options.compare_type === "higher" ? condition.options.tier < numeric : condition.options.tier === numeric;
        } else if (condition.type === "ranked_tier" && condition.options.queue === "ANY") {
            if (user.treat_as_unranked) return condition.options.compare_type === "equal" && condition.options.tier === 0;

            // For every tier, try matching.
            for (const tier of user.ranks) {
                const numeric = config.riot.tiers.indexOf(tier.tier) + 1;
                const matches = condition.options.compare_type === "lower"
                    ? condition.options.tier > numeric
                    : condition.options.compare_type === "higher" ? condition.options.tier < numeric : condition.options.tier === numeric;

                if (matches) return true;
            }

            // None of the tiers matched.
            return false;
        } else if (condition.type === "champion_play_count") {
            // Check if we have a stats entry for the specified champion that matches the range.
            return user.stats.some(x =>
                x.champion_id === condition.options.champion
                && x.games_played >= condition.options.count);
        } else if (condition.type === "server") {
            // Check if we have an account in the specified region.
            return user.accounts.some(x => x.region === condition.options.region);
        } else {
            throw new Error("Invalid RoleCondition type.");
        }
    }

    /**
     * Omit id and role_id from the JSON object.
     */
    $formatJson(json: Pojo) {
        return omit(super.$formatJson(json), ["id", "role_id"]);
    }
}

decorators.hasMany("conditions", () => RoleCondition, "id", "role_id")(Role);
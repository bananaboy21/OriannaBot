
import { Command } from "../command";
import { RangeCondition, RankedTierCondition, TypedRoleCondition } from "../../types/conditions";
import StaticData from "../../riot/static-data";
import { emote, paginate } from "./util";
import config from "../../config";

const RolesCommand: Command = {
    name: "Show Server Roles",
    smallDescription: "Shows all roles configured on the current server.",
    description: `
Shows all the roles and their requirements as configured on the current Discord server. This will list all roles, along with an indication of whether or not you are currently eligible for them.

Note that the same role might appear twice in the list with different requirements. If this is the case, you will receive the role if you are eligible for at least one of the "sets" of conditions.
`.trim(),
    keywords: ["roles", "config", "ranks"],
    async handler({ guild, user: loadUser, server: loadServer, error, ctx }) {
        if (!guild) return error({
            title: "🛑 Server Missing",
            description: "This command explicitly says that it shows _server_ information, yet you try to use it in DMs? Madman."
        });

        const server = await loadServer();
        const user = await loadUser();
        const sign = (x: boolean) => x ? "✅" : "❌";
        const capitalize = (x: string) => x[0].toUpperCase() + x.slice(1);

        // Load data we need for showing eligibility.
        await server.$loadRelated("roles.conditions");
        await user.$loadRelated("[accounts, ranks, stats]");

        if (!server.roles!.length) return error({
            title: "🔍 There Seems To Be Nothing Here...",
            description: "The current server does not seem to have any roles configured."
        });

        const formatRange = (range: RangeCondition<any>) => {
            if (range.compare_type === "at_least") return "at least " + range.value.toLocaleString();
            if (range.compare_type === "at_most") return "at most " + range.value.toLocaleString();
            if (range.compare_type === "exactly") return "exactly " + range.value.toLocaleString();
            return "between " + range.min.toLocaleString() + " and " + range.max.toLocaleString()
        };
        const formatChampion = async (id: number) => {
            const champ = await StaticData.championById(id);
            return emote(ctx, champ) + " " + champ.name;
        };
        const formatRanked = (cond: RankedTierCondition) => {
            const tier = cond.options.tier === 0 ? "Unranked" : capitalize(config.riot.tiers[cond.options.tier - 1].toLowerCase());
            const queue = config.riot.rankedQueues[cond.options.queue];
            return (cond.options.compare_type === "equal" ? "of " + tier : cond.options.compare_type + " than " + tier) + " in " + queue;
        };

        const formatCondition = async (cond: TypedRoleCondition): Promise<string> => {
            if (cond.type === "mastery_level") return "Have a mastery level of " + formatRange(cond.options) + " on " + await formatChampion(cond.options.champion);
            if (cond.type === "mastery_score") return "Have a mastery score of " + formatRange(cond.options) + " on " + await formatChampion(cond.options.champion);
            if (cond.type === "total_mastery_score") return "Have a total mastery score of " + formatRange(cond.options);
            if (cond.type === "ranked_tier") return "Have a ranked tier " + formatRanked(cond);
            if (cond.type === "champion_play_count") return "Have played at least " + cond.options.count.toLocaleString() + " games on " + await formatChampion(cond.options.champion);
            if (cond.type === "server") return "Have an active account on " + cond.options.region;
            return "Unknown condition type?"; // TODO(molenzwiebel): Should probably error out here or something.
        };

        const roleFields = await Promise.all(server.roles!.map(async x => ({
            name: x.name,
            value: (await Promise.all(x.conditions!.map(async x => sign(x.test(user)) + " "+ await formatCondition(<TypedRoleCondition>x)))).join("\n")
        })));

        return paginate(ctx, roleFields, {
            title: "📖 Server Roles",
            description: "The following roles are configured on this server. You will only receive a role if you are eligible for all conditions within the role."
        }, 4);
    }
};
export default RolesCommand;
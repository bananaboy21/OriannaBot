<template>
    <div class="user-profile" v-if="user">
        <div class="box">
            <div class="header accounts-header">
                <h2>Your League Accounts</h2>

                <div class="actions" v-if="user.accounts.length">
                    <a class="small-button" @click.prevent="addAccount" href="#">Add New</a>
                    <a class="small-button" @click.prevent="importDiscordAccounts" href="#">Import From <i class="discord-logo"></i></a>
                    <a class="small-button" @click.prevent="importRedditAccounts" href="#">Import From <i class="ion-social-reddit-outline"></i></a>
                </div>
            </div>

            <div class="body accounts">
                <div v-for="account in user.accounts" class="account" :key="account.region + account.summoner_id">
                    <img :src="`https://avatar.leagueoflegends.com/${account.region}/${encodeURIComponent(account.username)}.png`">
                    <span class="username">{{ account.username }}</span>
                    <span class="region">{{ account.region }}</span>
                    <span class="actions">
                        <a href="#" @click.prevent="deleteAccount(account)"><i class="ion-ios-trash-outline"></i></a>
                    </span>
                </div>

                <div class="no-accounts" v-if="!user.accounts.length">
                    <img src="https://ddragon.leagueoflegends.com/cdn/7.5.2/img/sticker/poro-question.png">
                    <p><b>You have no accounts configured.</b> Add one to begin tracking mastery score:</p>
                    <div class="actions">
                        <a class="small-button" @click.prevent="addAccount" href="#">Add New</a>
                        <a class="small-button" @click.prevent="importDiscordAccounts" href="#">Import From <i class="discord-logo"></i></a>
                        <a class="small-button" @click.prevent="importRedditAccounts" href="#">Import From <i class="ion-social-reddit-outline"></i></a>
                    </div>
                </div>
            </div>
        </div>

        <div class="box">
            <div class="header"><h2>Privacy Settings</h2></div>
            <div class="body">
                <div class="setting">
                    <div style="margin-top: 4px">
                        <input type="checkbox" v-model="user.hide_accounts" @change="updatePrivacySettings" style="margin-right: 5px; margin-bottom: 2px">
                        <b>Hide Accounts</b>
                    </div>
                    <p>Enabling this will prevent your accounts being shown when people use the profile command. Use this if you prefer keeping your League accounts private.</p>
                </div>

                <div class="setting">
                    <div>
                        <input type="checkbox" v-model="user.treat_as_unranked" @change="updatePrivacySettings" style="margin-right: 5px; margin-bottom: 2px">
                        <b>Hide Ranked Tier</b>
                    </div>
                    <p style="margin-bottom: 3px">When enabled, this will cause Orianna Bot to treat you as if you were unranked in all ranked queues. Note that this may affect which roles within a server you are eligible for.</p>
                </div>
            </div>
        </div>
    </div>

    <div v-else class="loader">Loading...</div>
</template>

<script lang="ts" src="./profile.ts"></script>

<style lang="stylus">
    .user-profile
        align-self flex-start
        display flex
        flex-direction column

        .setting > div
            display flex
            align-items center

        .actions
            display flex

        .small-button
            border 1px solid #dcdcdc
            text-decoration none
            text-transform uppercase
            margin 0 4px
            padding 4px 6px
            color #333
            display flex
            align-items center
            transition 0.2s ease

            & i
                margin-left 3px

        .discord-logo
            display inline-block
            width 20px
            height 20px
            background-image url(https://discordapp.com/assets/41484d92c876f76b20c7f746221e8151.svg)
            background-size cover

        .small-button:hover
            border-color #b2b2b2

        .accounts-header
            display flex
            align-items center

            h2
                flex 1

        .accounts
            padding 0

        .accounts .account
            display flex
            align-items center
            padding 12px 30px

            img
                width 45px
                height 45px
                border-radius 50%
                border 3px solid #ae8939

            .username
                padding-left 20px
                font-size 17px
                flex 1

            .region
                font-size 17px
                flex 1

            .actions > a
                text-decoration none
                color #1e87f0
                font-size 30px

        .accounts .account:nth-child(2n)
            background-color #f9f9f9

        .accounts .account:not(:first-of-type)
            border-top 1px solid #cdd2d2

        .no-accounts
            padding 20px
            display flex
            flex-direction column
            align-items center
            jusitify-content center
            color #333

            img
                filter grayscale()
                opacity 0.6
                width 160px

            p
                max-width 300px
                text-align center
</style>
module.exports = {

    HTTP_PORT: 3000,
    HTTPS_PORT: 443,

    CONVEE: {
        BOT_ID: process.env.BOT_ID,
        USER_ID: process.env.BOT_ID,
        SERVER_URL: process.env.SERVER_URL,
        BOT_HOST:"https://"+process.env.BOT_NAME+".herokuapp.com/"
    },
    ADAPTER: {
        FACEBOOK: {
            ENABLED: true,
            MESSENGER_WEBHOOK:"/fb_webhook",
            MESSENGER_APP_ID: "1116053291891275",
            MESSENGER_ACCESS_TOKEN: "EAAP3C2gDeksBAPgw0oPLjKtke47wX9IsNZCZClWcbYLLI5kLwPnh8Lp6DOuMeOuQtnlB2AvbuAYqKGigT1KeULXs7joIXTJ7fIZBOwPAK1iDcNj5O1lZCUbb31OVnGm2aLZCRZCsONilRP8qviO6V8TxFs2pbGmZCeLc24nLSCcAZBZCjkpl8yz7h",
            MESSENGER_APP_SECRET: "b2bc174a8c8c33294764aaba925899be",
            MESSENGER_VERIFY_TOKEN: "convee_adapter"
        },

        TELEGRAM:{
            ENABLED: true,
            MESSENGER_WEBHOOK:"/tg_webhook",
            TOKEN:"655704211:AAGeiuWsoTvdOr1n0Y6VpUIiQb5FfhWfaRM"
        }

    }

}
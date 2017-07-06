"use latest";

const slackNotify = require( "slack-notify" );

module.exports = ( ctx ) => {
    const { SLACK_WEBHOOK, SLACK_CHANNEL } = ctx.secrets;
    if ( !SLACK_WEBHOOK ) {
        throw new Error( "'SLACK_WEBHOOK' is a required secret" );
    }

    const { repoOwner, repoName } = ctx.data;
    const slack = slackNotify( SLACK_WEBHOOK );
    return {
        notify( conflicts ) {
            return new Promise( ( resolve, reject ) => {
                if ( conflicts && conflicts.length ) {
                    const transform = ( conflict ) => {
                        return `<${ conflict.url }|PR-${conflict.number}: ${ conflict.title }>`;
                    };
                    const msg = {
                        channel: SLACK_CHANNEL,
                        text: `You've got some conflicts on \`${ repoOwner }/${ repoName }\`:`,
                        attachments: [ {
                            text: conflicts.map( transform ).join( ", " )
                        } ]
                    };
                    slack.send( msg, ( err, header, statusCode, body ) => {
                        if ( err ) {
                            return reject( err );
                        }
                        return resolve( { statusCode, body } );
                    } );
                }
            } );
        }
    };
};
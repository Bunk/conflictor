"use latest";

const githubFactory = require( "./github" );
const slackFactory = require( "./slack" );

// TODO: Allow registration of the webhook if it doesn't already exist on this repository.
module.exports = ( ctx, cb ) => {
    const git = githubFactory( ctx );
    const slack = slackFactory( ctx );

    const payload = JSON.parse( ctx.body.payload );
    if ( payload && payload.hook ) {
        // This is a ping event.
        // TODO: Actually validate the request matches the webhook we registered. :X
        return cb( null, { status: "OK" } );
    }

    function fetchMergeability( prs ) {
        const promises = [];
        for ( let pr of prs ) {
            const promise = git.isMergeable( pr.number )
                .then( mergeable => Object.assign( pr, { mergeable } ) );
            promises.push( promise );
        }
        return Promise.all( promises );
    }

    function filterMergeConflicts( prs ) {
        return prs.filter( pr => !pr.mergeable );
    }

    function notifySlack( conflicts ) {
        return slack.notify( conflicts );
    }

    git.currentPullRequests()
        .then( fetchMergeability )
        .then( filterMergeConflicts )
        .then( notifySlack )
        .then( conflicts => {
            return cb( null, { conflicts } );
        } )
        .catch( err => {
            return cb( err );
        } );
};

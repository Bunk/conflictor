"use latest";

const Octokat = require( "octokat" );
const retry = require( "retry" );

function attemptWithBackoff( fn ) {
    return new Promise( ( resolve, reject ) => {
        const operation = retry.operation();
        operation.attempt( ( currentAttempt ) => {
            fn( ( err, result ) => {
                if ( operation.retry( err ) ) {
                    console.log( `Unable to determine mergeability.  Retry attempt: ${ currentAttempt }` );
                    return;
                }
                return err ? reject( err ) : resolve( result );
            } );
        } );
    } );
}

module.exports = ( ctx ) => {
    const { GITHUB_TOKEN } = ctx.secrets;
    if ( !GITHUB_TOKEN ) {
        throw new Error( "'GITHUB_TOKEN' is a required secret" );
    }

    const { repoOwner, repoName } = ctx.data;
    if ( !repoOwner || !repoName ) {
        throw new Error( "'repoOwner' and 'repoName' are required parameters" );
    }

    const octo = new Octokat( { token: GITHUB_TOKEN } );
    const repo = octo.repos( repoOwner, repoName );
    return {
        currentPullRequests() {
            // TODO: Handle pagination
            return repo.pulls.fetch()
                .then( result => ( result.items || [] ).map( result => ( {
                    number: result.number,
                    title: result.title,
                    url: result.url
                } ) ) )
                .catch( err => {
                    console.error( "Unable to fetch pull requests", err );
                } );
        },
        isMergeable( pr ) {
            function check( cb ) {
                repo.pulls( pr ).fetch()
                    .then( result => {
                        const { mergeable } = result;
                        if ( mergeable === null ) {
                            // GitHub will return null if it has not processed mergeability, yet,
                            // so let's try again in a few seconds.
                            return cb( new Error( "Unable to determine mergeability" ) );
                        }
                        return cb( null, mergeable );
                    } )
                    .catch( err => cb( err ) );
            }

            return new Promise( ( resolve, reject ) => {
                check( ( err, mergeable ) => {
                    if ( err ) {
                        return reject( err );
                    }
                    return resolve( mergeable );
                } );
            } ).catch( err => {
                console.error( "Unable to fetch the pull requests's mergeability", err );
            } );
        }
    };
};
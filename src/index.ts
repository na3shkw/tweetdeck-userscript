import { BackByMousebutton } from './features/backByMousebutton';
import { Clock } from './features/clock';
import { ExcludeActivity } from './features/excludeActivity';
import { HideImageActionLink } from './features/hideImageActionLink';
import { HorizontalScroll } from './features/horizontalScroll';
import { MouseActionsEvent } from './features/mouseActionsEvent';
import { OpenInWeb } from './features/openInWeb';
import { RestrictTweetAction } from './features/restrictTweetAction';
import { elem } from './utils/dom';

const features = [
    MouseActionsEvent,
    BackByMousebutton,
    Clock,
    ExcludeActivity,
    HideImageActionLink,
    HorizontalScroll,
    OpenInWeb,
    RestrictTweetAction,
];

function main() {
    const instances: any[] = [];
    features.forEach((featureClass) => {
        instances.push(new featureClass());
    });
    // MutationObserverで表示要素の変更を監視
    const mutationObserver = new MutationObserver((mutations) => {
        instances.forEach((instance) => {
            if (instance.initObserver) {
                try {
                    instance.initObserver(mutations);
                } catch (error) {
                    console.error(error);
                }
            }
        });
    });
    const appElem = elem('.application');
    if (appElem) {
        mutationObserver.observe(appElem, {
            childList: true,
            subtree: true,
        });
    }
}

(function () {
    'use strict';

    const mutationObserver = new MutationObserver((mutations) => {
        const filteredMutations = mutations.filter((mutation) => {
            const target = mutation.target as Element;
            if (target) {
                return target.classList.contains('application');
            }
            return false;
        });
        if (filteredMutations.length > 0) {
            main();
            mutationObserver.disconnect();
        }
    });
    mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
    });
})();

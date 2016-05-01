if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').then(function() {
        if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
            return console.warn('Notifications are not supported');
        }
        if (Notification.permission === 'denied') {
            return console.warn('Notifications are blocked by the user.');
        }
        if (!('PushManager' in window)) {
            return console.warn('Push notifications are not supported.');
        }

        navigator.serviceWorker.ready.then(function(registration) {
            registration.pushManager.getSubscription()
                .then(function(subscription) {
                    if (!subscription) {
                        return subscribeToPushNotifications();
                    }
                    sendSubscriptionToServer(subscription);
                })
                .catch(function(error) {
                    console.error('Error in getSubscription()', error);
                });

            function subscribeToPushNotifications() {
                registration.pushManager.subscribe({ userVisibleOnly: true })
                    .then(function(subscription) {
                        sendSubscriptionToServer(subscription);
                    })
                    .catch(function(error) {
                        if (Notification.permission === 'denied') {
                            console.warn('Permission for Notification was '
                                + 'denied.');
                        } else {
                            console.error('Unable to subscribe to push '
                                + 'notifications.', error);
                        }
                    });
            }

            function sendSubscriptionToServer(subscription) {
                var subscriptionId = subscription.endpoint.split('/').pop();
                var xhr = new XMLHttpRequest();
                xhr.open('GET', '/subscribe?id=' + subscriptionId);
                xhr.send();
            }
        });
    });
}

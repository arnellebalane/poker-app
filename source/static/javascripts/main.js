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
                    sendSubscriptionToServer('subscribe', subscription);
                })
                .catch(function(error) {
                    console.error('Error in getSubscription()', error);
                });

            function subscribeToPushNotifications() {
                registration.pushManager.subscribe({ userVisibleOnly: true })
                    .then(function(subscription) {
                        sendSubscriptionToServer('subscribe', subscription);
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

            function unsubscribeFromPushNotifications() {
                registration.pushManager.getSubscription()
                    .then(function(subscription) {
                        return subscription.unsubscribe().then(function() {
                            sendSubscriptionToServer(
                                'unsubscribe', subscription);
                        });
                    })
                    .catch(function(error) {
                        console.error('Error in getSubscription()', error);
                    });
            }

            function sendSubscriptionToServer(endpoint, subscription) {
                var subscriptionId = subscription.endpoint.split('/').pop();
                var url = endpoint + '/?id=' + subscriptionId;

                var xhr = new XMLHttpRequest();
                xhr.open('GET', url);
                xhr.send();
            }
        });
    });
}


document.addEventListener('click', function(e) {
    var user = e.target.closest('.user');
    if (user) {
        var id = user.dataset.id;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/poke?id=' + id);
        xhr.send();
    }
});

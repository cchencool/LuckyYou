var LotterySys = angular.module('LotterySys', ['ngRoute'])
    .constant("WORD_LENGTH", 10)
    .constant("CHARACTERS", "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789")
    .constant("selectedClass", "active")
    .constant("seed", 6000)
    .service("randomService", function () {
        this.random_gene = function (seed, use_seed = false) {
            if (use_seed) {
                var x = Math.sin(seed++) * 10000;
                return x - Math.floor(x);
            } else {
                return Math.random();
            }
        }
    })
    .service("get_wordsService", function (WORD_LENGTH, CHARACTERS, randomService) {
        this.get_words = function () {
            var words = '';
            for (j = 0; j < WORD_LENGTH; j++) {
                words += CHARACTERS.charAt(Math.floor((randomService.random_gene() * CHARACTERS.length)));
            }
            return words;
        }
    })
    .service('appService', function () {
        this.check_app_scope = function (app, key, scope) {
            if (!(key in app.view_scopes)) {
                app.view_scopes[key] = scope;
            }
        }
    })
    .constant("submitClass", "disabled");



LotterySys.config(function ($routeProvider) {
    $routeProvider.when('/', {
        templateUrl: "./components/views/demo.html"
    });
});




LotterySys.controller("generateLotterycontroller", function ($scope, $route, $window, appService, $timeout) {
    $scope.curLottery = {};
    appService.check_app_scope($window.App, 'generateLotterycontroller', $scope);

    $scope.generateLottery = function (curLottery) {
        console.log(curLottery)
        window.App.createlottery().then(() => {
            console.log($scope.curLottery);
            $timeout($scope.reload, 2000);
        });

    }
});

// LotterySys.controller("lotteryresultcontroller", function ($scope, $route, $window, appService) {
//     $scope.lotteryResult = [];
//     appService.check_app_scope($window.App, 'lotteryresultcontroller', $scope);
//     window.App.test().then(()=>console.log($scope.lotteryResult), error => console.log(error));
//     // $scope.generateLottery = function (curLottery) {
//     //     console.log(curLottery)
//     // }
// });

LotterySys.controller("joinAddcontroller", function ($scope, $window, appService, $timeout) {
    appService.check_app_scope($window.App, 'joinAddcontroller', $scope);
    $scope.join_addr_lottery = function (join_addr) {
        console.log(join_addr)
        window.App.joinlottery(join_addr).then(() => {
            $timeout($scope.reload, 2000);

        });
    }
});

LotterySys.controller("joincontroller", function ($scope, $route, $window, appService) {
    $scope.lotteryList = [];

    appService.check_app_scope($window.App, 'joincontroller', $scope);

    $scope.joinLottery = function (joinaddr) {
        console.log(joinaddr)

    }
});



LotterySys.controller("buyLotterycontroller", function ($scope, $route, $window, get_wordsService, appService, $timeout) {
    $scope.lotteryAccount = [];
    $scope.allbuylottery = [];
    $scope.def_amount = 5;

    appService.check_app_scope($window.App, 'buyLotterycontroller', $scope);
    setTimeout(() => {
        window.App.revealAccounts($scope.lotteryAccount).then(() => {
            // console.log('refresh list');
            for (var i = 0; i < $scope.lotteryAccount.length; i++) {
                var def_words = get_wordsService.get_words();
                $scope.lotteryAccount[i].def_words = def_words;
            }
            console.log($scope.lotteryAccount);

            // for (account in $scope.lotteryAccount) {

            // }
            $timeout($scope.reload, 2000)
        })
    }, 1000);


    $scope.buyLottery = function (allbuylottery) {
        var finalSelectedList = []

        for (item in allbuylottery) {
            allbuylottery[item].address = item;
            finalSelectedList.push(allbuylottery[item])
        }

        for (var index = 0; index < finalSelectedList.length; index++) {
            if (finalSelectedList[index].selected === true) {
                if (finalSelectedList[index].words && finalSelectedList[index].buyamount) {
                    window.App.buy(finalSelectedList[index].address, finalSelectedList[index].buyamount * 1e17, finalSelectedList[index].words).then(() => {
                        window.App.revealAccounts($scope.lotteryAccount).then(() => {
                            $timeout($scope.reload, 2000);
                        });
                    });
                } else {
                    if (finalSelectedList[index].buyamount) {
                        window.App.buy(finalSelectedList[index].address, finalSelectedList[index].buyamount * 1e17, $scope.lotteryAccount[index].def_words).then(() => {
                            window.App.revealAccounts($scope.lotteryAccount).then(() => {
                                $timeout($scope.reload, 2000);
                            });
                        });
                    }

                    if (finalSelectedList[index].words) {
                        window.App.buy(finalSelectedList[index].address, $scope.def_amount * 1e17, finalSelectedList[index].words).then(() => {
                            window.App.revealAccounts($scope.lotteryAccount).then(() => {
                                $timeout($scope.reload, 2000);
                            });
                        });
                    }

                    window.App.buy(finalSelectedList[index].address, $scope.def_amount * 1e17, $scope.lotteryAccount[index].def_words).then(() => {
                        window.App.revealAccounts($scope.lotteryAccount).then(() => {
                            $timeout($scope.reload, 2000);
                        });
                    });
                }
            }
        }

    };

    $scope.endlottery = function () {
        window.App.endLottery().then(() => {
            window.App.revealAccounts($scope.lotteryAccount).then(() => {
                $timeout($scope.reload, 2000);
            });
        });
    };

});
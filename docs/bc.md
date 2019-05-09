## Smart Contract Logic

<img src="/Users/Chen/Library/Mobile Documents/com~apple~CloudDocs/HKUST/MSBD6000D_IntroBlockChain/msbd6000d_project/docs/KkHs0mrK239tycsM0P_7HPuEI7i5fGitM2gKKvl5NSI73ET-sZUQJ9ScvuFWJo5YcOmGLVjwttSK9q_f6xMmTj-E1Mtqp0lVTenoQXPpFynhs3d28U7o4IAiz0q6CT8AZf8JIwFOK-o.png" style="zoom:70%"/>

As this graph shows there are 3 parties in this framework. Users, Smart Contract and EtherNet.

As we know, the smart contract is running on the EVM which could be seen as a black box for developers and App users. So most of the interactions we care happens between users and the contract.

There are 4 stages or functions in this lottery contract — Initial, Buy, End, Lucky Draw. Most ordinary users only need to use the Buy function to participate in the game while only the lottery creator will call the initial function once to setup some basic attributes of this specific game instance. Attributes are like total time span of this game, beneficiary address, prize ratio. This transaction will return the game address. Then everyone can join the game by calling buy function, and sending their money ( here using **ETH**) to the contract. All the money from user will added to the prize pool. When the end time comes, all the buy function will be disabled and any call of End function will trigger Lucky Draw function to calculate the winner and transfer the money to winner and beneficiary. After these process, the contract will be disabled but forever saved on the ethereum blockchain, and anyone can access its history data buy checking variables in this contract address.

- Validation of lottery: by setting lottery EndTime

- Interaction: the prize was transferred after lottery EndTime (Premise: only winner & beneficiary addresses are valid)
- Prize for winner: contract balance × winner_percent 

- Prize for beneficiary: contract balance - Prize for winner

- Winner selection: based on share, the more you purchase, the higher chance you can win.

Besides, here are some important attributes and principle of the contract. 

First, the transactions can only be made within the lottery time span, once the lottery was ended, no one can make effective interaction with the contract anymore. 

Second, the prize for winner and beneficiary are distributed upon the total balance of the contract till end and the pre-settled ratio by creator.

Finally, there is one principle of the winner selection, the more you purchase, the higher chance you will win. 



## Winner Selection Logic

<img src="/Users/Chen/Library/Mobile Documents/com~apple~CloudDocs/HKUST/MSBD6000D_IntroBlockChain/msbd6000d_project/docs/image-20190507155504333.png" style="zoom:25%"/>

This flow graph shows the underlie logic of winner selection and the mechanism of randomness in the contract. Firstly, each user have their own purchases and nonce. The contract will arrange their winning probability according the ratio of money the invest and the total prize until the final moment. Each user will be assigned a range of index logically in order, whoever capture the final random number will be the winner. Moreover, all the Nonce will be exclusive OR together with some other random value such as timestamp or blockIDs. And then, using operation result as the input(seed) to the built-in SHA256 algorithm to generate a bytes32 value, then cast it to int32 and then mod by the total balance. The int value result is the winner index which help to local the winner finally.



## Fairness Proof

<img src="/Users/Chen/Library/Mobile Documents/com~apple~CloudDocs/HKUST/MSBD6000D_IntroBlockChain/msbd6000d_project/docs/9jJLSquMkYBsz4ayQ-5VIWFtymD-n-K7DSYB2E3T0AU3fc0lcglAVGKmASE9cDQ510OAb36bsBDGl6AxWvQMiVXugw-k4HjO-YeUBbdR7kCWz4MvoC8-Yf6n036nEmY8OwEi7v6usNM.png" style="zoom:50%"/>

To make sure the game is fair enough in the randomness, we have tested the contract more than 5,000 times. For every time, each user buy a same amount of lottery, with random generated nonce (P.S. Here the random algorithm is using built-in random package of Node.js). 

As the result shows, the winning chance of each user is roughly around 0.1. Hence, we believe the random number is uniformly distributed in certain degree. But before put the contract in production, there are more work and test need to be done. Such as influence of total purchase amount and the number users on the winning chance.
pragma solidity >=0.4.22 <0.7.0;

contract LuckyYou {

    struct Ticket {
        bytes32 ticket_words;
        uint deposit;
        bool brought;
    }

    address payable public winner;
    address payable public beneficiary;
    uint public prize_for_winner;
    uint public prize_for_beneficiary;
    uint public lotteryEndTime;
    uint public winner_percent;
    bool ended;

    address payable[] players;
    mapping(address => Ticket) player_shares;
    // mapping(address => uint) player_shares;

    event lotteryEnded(address winner, uint winner_prize);
    event log(bytes32 seed, uint denominator);

    modifier onlyBefore(uint _time) {require (now < _time, "lottery already ended"); _ ;}
    modifier onlyAfter(uint _time) {require (now < _time, "not at the time yet"); _ ;}

    constructor (uint _lotteryTime, address payable _benificiary, uint _winner_percent) public {

        require(_winner_percent < 100 && _winner_percent > 1, "winner prize percentage should between [1, 100)");

        beneficiary = _benificiary;
        lotteryEndTime = now + _lotteryTime;
        winner_percent = _winner_percent;
    }

    function buy(bytes32 words) public payable onlyBefore(lotteryEndTime) {

        require(!player_shares[msg.sender].brought, "user already participated");

        if (msg.value != 0) {
            players.push(msg.sender);
            player_shares[msg.sender] = Ticket({
                ticket_words : words,
                deposit : msg.value,
                brought : true
            });
        }
    }

    function lotteryEnd() public {//onlyAfter(lotteryEndTime) {

        // 1.conditions
        require(!ended, "lottery already ended!");

        // 2. effect
        ended = true;
        // 2.1 draw
        uint total_amount = 0;
        bytes32 seed;
        require(players.length > 0, "no players");
        for (uint i = 0; i < players.length; i++) {
            total_amount += player_shares[players[i]].deposit;
            seed ^= player_shares[players[i]].ticket_words;
        }
        prize_for_winner = total_amount * winner_percent / 100;
        prize_for_beneficiary = total_amount - prize_for_winner;

        // the more you buy, the higher change you win.
        // 2.2 find the winner position based on the share.
        uint win_idx = luckyOne(seed, total_amount);
        require(win_idx < total_amount, uint2str(win_idx));
        uint winner_idx = 0;
        uint current_loc = 0;
        for (;current_loc < win_idx; winner_idx++) {
            current_loc += player_shares[players[winner_idx]].deposit;
        }
        require(--winner_idx < players.length, uint2str(winner_idx));
        winner = players[winner_idx];

        // 2.2 split prize
        emit lotteryEnded(winner, prize_for_winner);

        // 3. interaction
        require(winner != address(0), "winner address wrong!");
        winner.transfer(prize_for_winner);
        beneficiary.transfer(prize_for_beneficiary);
    }

    function luckyOne(bytes32 seed, uint denominator) private view returns (uint) {
        // return 0;
        // uint player_count = players.length;
        require(denominator > 0, "denominator cannot be zero!");
        // return uint(uint256(keccak256(abi.encode(seed, "bytes32"))) + block.timestamp + block.difficulty) % denominator;
        // return uint(keccak256(abi.encodePacked(seed, block.timestamp, block.difficulty))) % denominator;
        seed = keccak256(abi.encodePacked(block.timestamp, block.difficulty, now, seed));
        return uint(seed) % denominator;
    }

    function uint2str(uint _i) internal pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len - 1;
        while (_i != 0) {
            bstr[k--] = byte(uint8(48 + _i % 10));
            _i /= 10;
        }
        return string(bstr);
    }
}

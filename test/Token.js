async function allowance(contract, owner, spender) {
    return contract.allowance(owner, spender);
}

async function approve(contract, spender, amount) {
    return (await contract.approve(spender, amount)).wait();
}

module.exports = { allowance, approve };

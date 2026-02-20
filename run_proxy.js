let visualStack = [
    { ids: ['1'], quantity: 1.5, type: 'liquid', color: 'red' },
    { ids: ['2'], quantity: 1.5, type: 'liquid', color: 'blue' },
    { ids: ['3', '1', '2'], quantity: 0.5, type: 'liquid', color: 'purple', isProduct: true }
];

let state = {
    reactionKey: '1_2eqK1',
    isEquilibrium: true,
    limitingYield: 0.5, // Shift forward by 0.5 to reach K=1 (num=1.0, den=1.0)
    outcome: [{ id: '3', type: 'liquid', count: 1 }]
};

let yieldFraction = state.limitingYield;
const consumptionNeeds = { '1': 0.5, '2': 0.5 };

let consumed = false;
const consumedIds = [];

visualStack.forEach(token => {
    const primaryId = token.ids.length > 0 ? token.ids[0] : null;
    const matchId = primaryId && Math.abs(consumptionNeeds[String(primaryId)]) > 0.0001 ? primaryId : null;

    if (matchId) {
        const needed = consumptionNeeds[String(matchId)];
        const available = token.quantity !== undefined ? token.quantity : 1.0;

        let take;
        if (needed > 0) {
            take = Math.min(available, needed);
        } else {
            take = needed;
        }

        token.quantity = available - take;
        consumptionNeeds[String(matchId)] -= take;

        if (token.quantity <= 0.01) {
            token.toRemove = true;
        }

        consumed = true;
        consumedIds.push(...token.ids);
    }
});

const newStack = visualStack.filter(t => !t.toRemove);
const uniqueConsumedIds = [...new Set(consumedIds)];
const products = state.outcome;

products.forEach(prod => {
    let finalType = prod.type || 'liquid';
    let finalColor = prod.color || '#fff';
    const productQty = yieldFraction * (prod.count || 1);
    const compoundIds = prod.id ? [prod.id, ...uniqueConsumedIds] : [...uniqueConsumedIds];
    const finalIds = [...new Set(compoundIds)];

    if (state.isEquilibrium) {
        const existingToken = newStack.find(v => v.ids.includes(prod.id));
        console.log("Found existing product token:", existingToken);
        if (existingToken) {
            existingToken.quantity = (existingToken.quantity || 1.0) + productQty;
            if (existingToken.quantity <= 0.01) {
                existingToken.toRemove = true;
            }
            return;
        }
    }

    if (productQty > 0.01) {
        const token = {
            ids: finalIds,
            type: finalType,
            color: finalColor,
            isProduct: true,
            quantity: productQty
        };
        newStack.push(token);
    }
});

console.log("Final Stack:", newStack.filter(t => !t.toRemove));

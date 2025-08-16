## Fixed costs

Vercel PRO plan: 20$ month
Supabase PRO plan: 25$ month
Claude Code MAX plan: 100$ month

**Total fixed costs**: 145$ month

## Variable Costs

### Open Router

Both model we use charge the same: $0.10 per M input tokens, $0.40 per M output tokens.

```
Typical usage pattern: 75% input tokens, 25% output tokens
Blended rate = (0.75 × $0.10) + (0.25 × $0.40) = $0.075 + $0.10 = $0.175 per 1M tokens
```

All subscriptions include 15M tokens, so: 15 x 0.175 = **2.625$ per client max.**


**Total variable costs**: number of clients x 3

## Total costs

145$ fixed + number of clients x 3$ variable
/**
 * Representative IB Economics 10-mark essays at three quality tiers.
 * Use these to spot-check that grading is realistic and consistent.
 *
 * Quick usage from the repo root (server running on :3000):
 *   npx tsx tests/run-samples.ts
 */

export interface SampleEssay {
  id: string;
  expectedScoreRange: [number, number];
  expectedLevel: 1 | 2 | 3 | 4;
  question: string;
  essay: string;
}

export const SAMPLES: SampleEssay[] = [
  {
    id: "low-quality",
    expectedScoreRange: [2, 4],
    expectedLevel: 1,
    question:
      "Discuss the view that an indirect tax is the most effective policy to reduce consumption of demerit goods. [10]",
    essay: `Indirect taxes are taxes on goods. The government uses them to stop people buying bad stuff like cigarettes. If the tax is high people will not buy as much because it is more expensive. This is good for the country. Some people think the tax is unfair because poor people still smoke. But it raises money for hospitals. I think indirect taxes are the best because they are simple and everyone pays them. So in conclusion they work well.`,
  },
  {
    id: "mid-quality",
    expectedScoreRange: [6, 8],
    expectedLevel: 3,
    question:
      "Discuss the view that an indirect tax is the most effective policy to reduce consumption of demerit goods. [10]",
    essay: `A demerit good is a good that is over-consumed in a free market because consumers under-estimate the private costs or ignore negative externalities of consumption. An indirect tax is a tax placed on producers, which shifts the supply curve upward (S to S+tax) and increases the price from P1 to P2, reducing the quantity from Q1 to Q2. This internalises the externality.

For example, the UK has a high tax on cigarettes and consumption has fallen over the years. This shows that indirect taxes can reduce demerit good consumption.

However, the effectiveness depends on the price elasticity of demand (PED). Cigarettes are addictive so demand is inelastic, meaning the tax increases government revenue more than it reduces quantity. Also, poorer consumers are hit harder, which is regressive. Other policies like education or banning advertising may work better in the long run.

In conclusion, an indirect tax is useful but not always the most effective policy.`,
  },
  {
    id: "high-quality",
    expectedScoreRange: [8, 10],
    expectedLevel: 4,
    question:
      "Discuss the view that an indirect tax is the most effective policy to reduce consumption of demerit goods. [10]",
    essay: `A demerit good is a good whose consumption generates negative externalities — external costs imposed on third parties not accounted for in the market price — leading to over-consumption at the free-market equilibrium (Qm) above the socially optimal quantity (Q*). An indirect tax is a tax on expenditure, levied on producers and typically passed on to consumers in the form of higher prices.

In a standard negative externality of consumption diagram, with price on the vertical axis and quantity on the horizontal, the marginal social benefit (MSB) curve lies below the marginal private benefit (MPB = D) curve by the value of the external cost. The free market equilibrium is at Qm where MPB = MSC, producing a welfare loss triangle between Qm and Q*. A specific indirect tax equal to the marginal external cost shifts the supply curve from S (MPC) upward to S+tax, raising price from P1 to P2 and contracting quantity from Qm toward Q*. Provided the tax is set equal to the MEC, the welfare loss is eliminated and the externality is internalised (Pigouvian logic).

This is well illustrated by the UK Soft Drinks Industry Levy (introduced 2018), which taxes sugary drinks above certain sugar thresholds. Public Health England data showed a roughly 30% fall in sugar content per 100 ml in taxed drinks within two years, as producers reformulated — a demand-side and supply-side response.

However, the effectiveness of an indirect tax depends critically on the price elasticity of demand (PED). Addictive demerit goods such as tobacco have a PED well below 1 (Chaloupka et al. estimate roughly –0.4 in developed economies), so the quantity response is muted and the policy raises far more revenue than it reduces consumption in the short run. In the long run PED rises as habits adjust, so the policy becomes more effective over time — a key short-run vs long-run trade-off.

Further, indirect taxes are regressive: lower-income households spend a larger share of income on demerit goods like tobacco, so the welfare burden is unevenly distributed. They may also encourage black markets, as in Australia's high cigarette tax leading to a documented rise in illicit tobacco. Alternative policies — sustained education campaigns, advertising bans, minimum unit pricing, or direct regulation — address the information failure at its root and may be more effective in the long run, though typically at higher administrative cost and with slower results.

Overall, an indirect tax is an effective short- to medium-run tool when demand has some elasticity and when enforcement is strong, and it has the added benefit of raising revenue that can be hypothecated to education or healthcare. However, for highly inelastic demerit goods it is unlikely to be the single most effective policy. The most effective approach is almost certainly a combination — taxation to shift incentives at the margin, regulation to set a floor, and education to shift long-run preferences — with the relative weighting depending on PED, the strength of the externality, and distributional concerns.`,
  },
];

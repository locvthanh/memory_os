// The Hydraulic Hall — scene 0 of the macroeconomics series, and its hub.
//
// A steampunk engine hall around a giant MONIAC: Bill Phillips's 1949 water
// computer, blown up into the circular-flow diagram on a brass-framed board.
//   * left tank HOUSEHOLDS, right tank FIRMS, both part-filled with aqua "money";
//   * SPENDING (C) runs along the bottom through the Main Pump, INCOME across
//     the top;
//   * three side circuits nest between them, every leakage leaving households
//     above and every injection entering firms below: banks (green, S -> I),
//     government (amber, T -> G), rest of the world (blue, M -> X);
//   * the recurring cast of the series stands at the foot of the machine: the
//     Baker, the Banker, the Governor (at the interest-rate valve, with the key),
//     the Treasurer and the Trader; the price-tagged loaf stands by the firms;
//   * the real 1949 MONIAC and a bronze of Phillips greet you at the entrance,
//     the GDP gauge stands east, the nine doors to the rest of the series line
//     the west wall, and the open-question door waits on the east wall.
//
// Source: blender_models/HydraulicHall.blend, generated through Blender MCP by
// blender_models/hydraulic_hall_scenegen/ (hh_*.py). Locus_01..11 are baked
// into the .blend, so build_glb.py's SCENES entry is empty; export prep is in
// scripts/macro_hydraulic_hall_export.py. No recentring. Every number below is
// three.js space, metres, generated from hh_layout.py LOCI (keep them in step).
//
// Camera: every stop parks the camera exactly at anchorFrom (a negative
// anchorDistance = the horizontal distance to the locus) at eyeHeight above
// the aim point (negative = below it, looking up at a tank) -- the same spot as
// the CAM_Lnn cameras in the .blend.
//
// The doors are not linked yet: the nine concept scenes don't exist. The viewer
// allows one `link:` per locus, so when they are built, split locus 9 into one
// stop per door (or link each concept from the tank it grows out of).

export default {
  // Open high over the entrance, with the whole machine in view.
  startView: {
    position: [0, 10.2, 22.4],
    lookAt: [0, 3.6, 2],
  },
  walkthrough: {
    travelSeconds: 4.5,
    dwellSeconds: 14,
    eyeHeight: 1.8,
    anchorDistance: -7,
    loop: true,
  },
  background: 0xcfd8d6,
  fog: { near: 70, far: 180 },
  lighting: {
    hemisphere: 0.95,
    ambient: 0.3,
    ambientColor: 0xffe8c8,
    sun: 1.2,
    // The hall is 40 m x 26 m, centred near the origin.
    shadowExtent: 30,
    // Brass, copper and glass need reflections to read.
    environment: true,
    environmentIntensity: 0.6,
    environmentColor: 0xf0e6d6,
  },
  labels: { worldSize: 0.42, offsetY: 1.1 },
  loci: [
    {
      id: 1,
      title: "1949 — Bill Phillips’s MONIAC: how this hall works",
      description: "In 1949 Bill Phillips (1914–1975), a New Zealander studying at the London School of Economics, built a machine that computes an economy with water. Before economics he had been a crocodile hunter in Australia and a prisoner of war in Java. He built the prototype over one summer in a garage in Croydon, from scrounged parts (some from a Lancaster bomber), for about £400. The MONIAC, or Phillips Machine, is about 2 m tall, 1.2 m wide and nearly 1 m deep: the real one stands in front of you at true size. Coloured water is money. It is pumped to the top and flows down through clear tanks and pipes, and valves you can set let it leak out (taxes, saving, imports) and flow back in. Twelve to fourteen were built, for Cambridge, Leeds, Harvard, Melbourne, Istanbul and others; one is in London’s Science Museum. Phillips’s name comes back in door 3, the Grand Station: the Phillips curve (1958).\n\nHOW TO READ THIS HALL: the giant machine on the north wall is the MONIAC blown up into the circular-flow diagram. Aqua water is money going round. The left tank is HOUSEHOLDS, the right tank is FIRMS. Spending runs along the bottom through the Main Pump; income comes back across the top. Everything that LEAKS out of households (saving, taxes, imports) runs right along the upper pipes; everything INJECTED into firms (investment, government spending, exports) runs right along the lower pipes. Green = banks, amber = government, blue = the rest of the world. The gold arrows point the way the money flows.",
      position: [-4.0, 1.5, 17.0],
      anchorFrom: [-4.0, 0, 21.3],
      anchorDistance: -4.3,
      eyeHeight: 0.5,
    },
    {
      id: 2,
      title: "The Main Pump — spending drives everything (C)",
      description: "Consumption, C: what households spend on goods and services, such as bread, rent, haircuts and phones. It is the biggest part of spending in most economies (about two-thirds of GDP in the United States), so it is the pump that drives the loop. When households spend, firms earn; firms hire and pay wages; the wages are spent again. The key idea of the whole hall: one person’s spending is another person’s income. Slow the pump and every tank downstream drops.\n\nThis pump is also the doorway to door 4, the Rollercoaster: booms and recessions are the pump speeding up and slowing down.",
      position: [0.0, 1.7, 1.8],
      anchorFrom: [0.0, 0, 8.5],
      anchorDistance: -6.7,
      eyeHeight: 0.6,
    },
    {
      id: 3,
      title: "The Household Tank — the Baker",
      description: "Households own everything in the end: their work, land, savings and shares. They sell these to firms and get INCOME back through the top pipe: wages for work, rent for land, interest for money lent, and profits for owning firms. Each dollar of income then goes one of three ways: spent (C, the bottom pipe to the firms), saved (S, the green pipe to the banks) or paid in tax (T, the amber pipe to the government). Some of what is spent buys foreign goods (M, the blue pipe, imports).\n\nTHE CAST: the Baker stands here. He appears in every scene of the series, because he is both halves of the economy: at home he is a household (he earns a wage, buys shoes, pays tax, puts money aside), and at work he is a firm (next stop). The water level in this tank is household income.",
      position: [-9.0, 4.2, 1.7],
      anchorFrom: [-8.0, 0, 9.8],
      anchorDistance: -8.16,
      eyeHeight: -2.3,
    },
    {
      id: 4,
      title: "The Firm Tank — output and income are the same water, seen twice",
      description: "Firms turn inputs into output: the Baker’s bakery turns flour, an oven and his work into loaves (the rack by the oven is today’s output). Every dollar a firm takes in from sales is, penny for penny, somebody’s income: wages for its workers, rent for its landlord, interest for its lenders, and whatever is left is profit for its owners. That is why the value of everything produced (output) equals everything earned (income) equals everything spent on it (spending). Four streams pour into this tank: households’ spending (C), investment (I, green), government spending (G, amber) and exports (X, blue). Take away imports (M), which were made abroad, and you have GDP: C + I + G + (X – M), the formula on the banner. Count only FINAL goods: the loaf, not the flour inside it, or the flour gets counted twice.\n\nTHE LOAF: the loaf with the price tag is in every scene of the series. Here it costs $2.00, a normal price. In the Funhouse of Prices (door 2) its price will balloon.",
      position: [9.0, 4.2, 1.7],
      anchorFrom: [8.0, 0, 9.8],
      anchorDistance: -8.16,
      eyeHeight: -2.3,
    },
    {
      id: 5,
      title: "The Banks — the savings drain and the investment pump",
      description: "Saving (S) is the part of income households don’t spend. It is a LEAKAGE from the loop: it drains into the banks’ green tank. The Banker’s job is to pump it back in as loans to people who want to INVEST (I): new ovens, factories, machines, houses, software. Investment means spending on things that make more things later. If saving runs ahead of investment, water piles up in the bank tank and the main loop shrinks; if investment runs ahead, the loop grows.\n\nKeynes’s paradox of thrift: if everyone tries to save more at the same time, spending falls, incomes fall, and total saving may not rise at all.\n\nBanks do more than pass savings along: when a bank makes a loan it creates new money. That is door 1, the Vault of Money. Investment is also what makes countries richer over time (door 8, the Rice Terraces).",
      position: [-4.3, 4.0, 1.0],
      anchorFrom: [-4.7, 0, 8.2],
      anchorDistance: -7.21,
      eyeHeight: -2.1,
    },
    {
      id: 6,
      title: "The Governor’s valve — the interest rate",
      description: "The Governor is the central bank (the Federal Reserve, the Bank of England, the State Bank of Vietnam…). She does not run the pump. She holds the key to one valve, the INTEREST RATE, the price of borrowing. Open it (cut rates) and loans get cheaper, so more money flows out of the bank tank into investment, houses and cars, and spending speeds up. Close it (raise rates) and the flow slows, which cools spending and inflation. The valve is locked with a key because most central banks are independent: governments appoint the Governor but don’t turn the key themselves. Changing the money flow this way is MONETARY POLICY.\n\nHer giant key opens door 5, the Dam, where the whole river of credit is controlled.",
      position: [-2.4, 2.3, 1.1],
      anchorFrom: [-2.0, 0, 7.2],
      anchorDistance: -6.11,
      eyeHeight: -0.4,
    },
    {
      id: 7,
      title: "The Government Tank — the Treasurer",
      description: "Taxes (T) are a LEAKAGE: income drained away from households through the amber tax valve. Government spending (G) is an INJECTION: the Treasurer pays for roads, schools, soldiers and nurses’ wages, which flows straight into the firm tank. Pensions and benefits are transfers, not G: they only show up in GDP when the people who receive them spend the money. Using taxes and spending to steer the economy is FISCAL POLICY.\n\nIf G is bigger than T, the government runs a DEFICIT and borrows the gap, usually by selling bonds to the banks’ tank next door. The deficit is a flow (like water running in); the debt is a stock (the water level, the pile of all past deficits). Door 6, the Treasury Bathhouse, is about that difference.",
      position: [0.0, 4.1, 1.0],
      anchorFrom: [0.6, 0, 8.2],
      anchorDistance: -7.22,
      eyeHeight: -2.2,
    },
    {
      id: 8,
      title: "The Rest of the World — the Trader",
      description: "Imports (M) are what we spend on goods and services made abroad: money leaving the loop down the blue pipe. Exports (X) are foreigners buying from our firms: money flowing in to the firm tank. X – M is NET EXPORTS. When a country imports more than it exports it runs a trade deficit, and pays for the gap by borrowing from the rest of the world or selling it assets. The little steamship on the tank is there because trade goes by sea: over 80% of world trade by volume travels by ship. The Trader, with her spyglass and crate, is the recurring face of the rest of the world.\n\nThe valve on this circuit is the EXCHANGE RATE, the price of one currency in another. That is door 7, the Port City.",
      position: [4.3, 4.0, 1.0],
      anchorFrom: [4.7, 0, 8.2],
      anchorDistance: -7.21,
      eyeHeight: -2.1,
    },
    {
      id: 9,
      title: "The Nine Doors — the map of the series",
      description: "Each door leads to one scene of the series, and each grows out of one part of the machine:\n1 The Vault of Money: what money is and how banks create it (from the banks’ tank).\n2 The Funhouse of Prices: inflation and deflation (from the loaf).\n3 The Grand Station: unemployment (from the firms, which hire).\n4 The Rollercoaster: booms and recessions (from the Main Pump).\n5 The Dam: central banks and interest rates (from the Governor’s valve).\n6 The Treasury Bathhouse: taxes, deficits and debt (from the government’s tank).\n7 The Port City: trade and exchange rates (from the rest of the world).\n8 The Rice Terraces: long-run growth (from investment).\n9 The Glass Tower: bubbles and financial crises (what happens when the bank tank overflows).\n\nThe doors are still shut: those scenes are being built. The five figures you met at the machine, the Baker, the Banker, the Governor, the Treasurer and the Trader, will be waiting behind every one of them, and so will the loaf.",
      position: [-20.0, 2.4, 8.0],
      anchorFrom: [-6.8, 0, 8.0],
      anchorDistance: -13.2,
      eyeHeight: -0.3,
    },
    {
      id: 10,
      title: "The GDP Gauge — three ways to measure, one number",
      description: "GDP, gross domestic product, is the market value of all the final goods and services produced in a country over a period, usually a quarter or a year. There are three ways to measure it, and the three dials always agree because they read the same water at different points in the loop:\nOUTPUT: add up the value added by every firm.\nINCOME: add up all the wages, rent, interest and profits.\nSPENDING: add up C + I + G + (X – M).\nREAL GDP takes out price changes, so a loaf that costs more doesn’t count as more bread. GDP growth is how fast real GDP rises; GDP per person divides it by the population. A common rule of thumb calls two quarters in a row of falling real GDP a recession.\n\nModern national accounts go back to the 1930s: Simon Kuznets built the first official estimates of US national income and presented them to Congress in 1934.",
      position: [13.5, 2.1, 5.0],
      anchorFrom: [10.75, 0, 9.76],
      anchorDistance: -5.5,
      eyeHeight: -0.2,
    },
    {
      id: 11,
      title: "The open question — is GDP the right thing to measure at all?",
      description: "GDP counts everything bought and sold, and misses a lot: unpaid housework and caring, leisure time, nature used up, who gets the income (inequality), and free digital services all barely show. A war, an oil spill clean-up or a traffic jam can add to GDP. Simon Kuznets, who built the first US national accounts, warned in his 1934 report: ‘The welfare of a nation can scarcely be inferred from a measurement of national income.’ In 1968 Robert Kennedy said GDP ‘measures everything, in short, except that which makes life worthwhile’.\n\nAlternatives exist: the UN’s Human Development Index (1990) adds health and education; Bhutan measures Gross National Happiness; the Stiglitz–Sen–Fitoussi report (2009) urged countries to look beyond GDP to wellbeing and sustainability. Yet GDP is still the number every government and newspaper watches.\n\nStill argued about: should we steer by GDP, by something else, or by a dashboard of many numbers — and who decides what counts?",
      position: [20.0, 2.4, 12.0],
      anchorFrom: [14.0, 0, 12.0],
      anchorDistance: -6.0,
      eyeHeight: -0.4,
    },
  ],
};

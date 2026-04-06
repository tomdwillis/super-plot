export interface BlogPost {
  slug: string;
  title: string;
  metaDescription: string;
  targetKeyword: string;
  secondaryKeywords: string[];
  publishedAt: string; // ISO date
  updatedAt: string;
  excerpt: string;
  content: string; // HTML content
}

export const blogPosts: BlogPost[] = [
  {
    slug: "how-to-value-vacant-land",
    title:
      "How to Value Vacant Land in 2026: The Method Appraisers Actually Use",
    metaDescription:
      "Learn the 3 methods professional appraisers use to value vacant land — sales comparison, income approach, and cost approach. Step-by-step guide for land investors and buyers.",
    targetKeyword: "how to value vacant land",
    secondaryKeywords: [
      "vacant land valuation",
      "how much is my land worth",
      "land appraisal",
      "raw land value estimator",
    ],
    publishedAt: "2026-04-05T00:00:00Z",
    updatedAt: "2026-04-05T00:00:00Z",
    excerpt:
      "Valuing vacant land is harder than valuing a house. This guide walks through the same methods licensed appraisers use — adapted for land investors and buyers who need a reliable number.",
    content: `
<p>Valuing vacant land is harder than valuing a house. There are no bedrooms to count, no renovation costs to estimate, and far fewer comparable sales to reference. Yet knowing what a parcel is actually worth is the single most important step before you buy, sell, or finance land.</p>
<p>This guide walks through the same methods licensed appraisers use &mdash; adapted for land investors and buyers who need a reliable number without paying $3,000 for a formal appraisal.</p>

<h2>Why Land Valuation Is Different</h2>
<p>When you appraise a home, you start with the structure: square footage, condition, upgrades. Then you compare it to similar homes nearby. The data is abundant &mdash; millions of home sales happen every year, and most are recorded with detailed property attributes.</p>
<p>Vacant land doesn&rsquo;t work that way.</p>
<ul>
<li><strong>Fewer comps.</strong> In many rural counties, only a handful of vacant land parcels sell each year.</li>
<li><strong>More variables.</strong> Two 5-acre parcels a mile apart can be worth wildly different amounts depending on road access, zoning, slope, utilities, and flood zone status.</li>
<li><strong>No depreciation schedule.</strong> Land doesn&rsquo;t age or deteriorate like a building. Its value is driven entirely by location, legal rights, and physical characteristics.</li>
</ul>
<p>This is why automated home valuation tools (Zillow&rsquo;s Zestimate, Redfin estimates) perform poorly on vacant land. They were built for residential structures, not raw parcels.</p>

<h2>The 3 Methods Appraisers Use</h2>
<p>Professional appraisers rely on three approaches. For vacant land, the first is by far the most common.</p>

<h3>1. Sales Comparison Approach</h3>
<p>This is the standard method for most vacant land valuations. You find parcels that recently sold with similar characteristics and adjust for differences.</p>
<p><strong>Step by step:</strong></p>
<ol>
<li><strong>Identify comparable sales.</strong> Look for parcels that sold within the last 24 months, within a reasonable radius (5&ndash;20 miles depending on how rural the area is), with similar size, zoning, and characteristics.</li>
<li><strong>Gather at least 3&ndash;5 comps.</strong> More is better, but quality matters more than quantity. A comp from 2 miles away with the same zoning is worth more than 10 comps from across the county.</li>
<li><strong>Adjust for differences.</strong> No two parcels are identical. Common adjustments include:
  <ul>
  <li><strong>Road access:</strong> A parcel on a paved county road is worth more than one on a dirt path or landlocked parcel.</li>
  <li><strong>Utilities:</strong> Water, sewer, and electricity at the lot line add significant value vs. parcels where you need to drill a well or install solar.</li>
  <li><strong>Topography:</strong> Flat, buildable land commands a premium over steep or marshy terrain.</li>
  <li><strong>Size:</strong> Price per acre generally decreases as parcel size increases.</li>
  <li><strong>Zoning:</strong> Residential-zoned land near growth corridors is typically worth more than agricultural-zoned land in the same area.</li>
  </ul>
</li>
<li><strong>Calculate price per acre.</strong> After adjustments, average the price per acre across your comps. This gives you a defensible estimate.</li>
</ol>
<p><strong>Where to find comps:</strong></p>
<ul>
<li>County assessor/recorder websites (free, but often clunky)</li>
<li>REGRID or similar parcel data providers</li>
<li>MLS (filter to &ldquo;vacant land&rdquo; &mdash; not all land sales hit MLS)</li>
<li>Auction results from land auction platforms</li>
<li><a href="/order">Super Plot reports</a> (automated comp pulls with relevance scoring)</li>
</ul>

<h3>2. Income Approach</h3>
<p>Used when land generates income &mdash; agricultural leases, timber rights, hunting leases, or rental income from an existing use.</p>
<p><strong>How it works:</strong></p>
<ul>
<li>Estimate the annual net income the land can produce</li>
<li>Apply a capitalization rate (typically 3&ndash;8% for agricultural land)</li>
<li>Value = Net Income &divide; Cap Rate</li>
</ul>
<p><strong>Example:</strong> A 40-acre parcel leased for farming produces $4,000/year net. At a 5% cap rate, the land is worth $80,000.</p>
<p>This method is most relevant for productive agricultural land, timberland, or parcels with mineral rights.</p>

<h3>3. Cost Approach</h3>
<p>Rarely used for raw land alone, but relevant when you are evaluating land with development potential. The cost approach estimates what it would cost to create equivalent improvements (roads, utilities, grading) on a comparable raw parcel.</p>
<p>This method is more useful for subdivisions or development projects than for individual parcel purchases.</p>

<h2>Common Valuation Mistakes</h2>
<p><strong>Using the tax-assessed value.</strong> County assessments are often 30&ndash;50% below market value and are updated infrequently. Never use the assessed value as your estimate of market value.</p>
<p><strong>Ignoring access.</strong> A parcel without legal road access (landlocked) can be worth 50&ndash;80% less than an identical parcel with frontage on a county road.</p>
<p><strong>Comparing across zoning types.</strong> A residential-zoned lot near a growing town is not comparable to an agricultural parcel in the same county, even if the acreage is similar.</p>
<p><strong>Using stale comps.</strong> Land values in high-growth areas can shift 20&ndash;30% in a year. Comps older than 24 months should be used with caution.</p>

<h2>How Super Plot Helps</h2>
<p>Super Plot automates the research layer of land valuation. Enter any parcel address or APN and get a report covering:</p>
<ul>
<li><strong>Comparable sales</strong> &mdash; filtered by recency, distance, size, and zoning similarity</li>
<li><strong>Zoning and permitted uses</strong> &mdash; what you can legally build</li>
<li><strong>Environmental flags</strong> &mdash; flood zone, wetlands, EPA proximity</li>
<li><strong>Access and utilities</strong> &mdash; road frontage, water, sewer, electric</li>
<li><strong>Estimated value range</strong> &mdash; data-driven, not a black-box algorithm</li>
</ul>
<p>The basic report is free. No account required.</p>
`,
  },
  {
    slug: "land-comp-analysis",
    title:
      "Land Comp Analysis: How to Find Real Comparables for Raw Land",
    metaDescription:
      "Finding land comps is harder than finding home comps. Learn where to source comparable sales for vacant land, how to qualify them, and when to adjust. Practical guide for investors.",
    targetKeyword: "land comp analysis",
    secondaryKeywords: [
      "land comparable sales",
      "vacant land comps",
      "how to find land comps",
      "raw land comparables",
    ],
    publishedAt: "2026-04-05T00:00:00Z",
    updatedAt: "2026-04-05T00:00:00Z",
    excerpt:
      "Comparable sales are the backbone of any land valuation. But finding quality comps for vacant land requires more effort and more judgment than for homes.",
    content: `
<p>Comparable sales are the backbone of any land valuation. But unlike homes &mdash; where Zillow can surface dozens of recent sales in seconds &mdash; finding quality comps for vacant land requires more effort and more judgment.</p>
<p>This guide covers where to find land comps, how to evaluate whether a comp is actually comparable, and how to adjust for the differences that matter most.</p>

<h2>Why Land Comps Are Hard to Find</h2>
<p>Three structural problems make land comps scarce:</p>
<ol>
<li><strong>Low transaction volume.</strong> Many rural counties see fewer than 50 vacant land sales per year. Some see fewer than 10.</li>
<li><strong>Poor data standardization.</strong> Land sales are recorded by county recorders, but the level of detail varies wildly. Some counties record acreage, zoning, and parcel ID. Others record just a price and a legal description.</li>
<li><strong>High variance between parcels.</strong> Two 5-acre lots a half-mile apart can be worth completely different amounts based on access, utilities, topography, and zoning.</li>
</ol>
<p>This means you cannot rely on automated tools designed for residential properties. You need a method.</p>

<h2>Where to Find Land Comps</h2>

<h3>County Assessor and Recorder Websites</h3>
<p>Every county recorder maintains a record of property transfers. Most are searchable online, though the interfaces range from modern to unusable.</p>
<p><strong>What you get:</strong> Sale price, date, parcel ID, buyer/seller names, and sometimes acreage.</p>
<p><strong>Limitations:</strong> Often lacks property details (zoning, access, utilities). You may need to cross-reference with the assessor&rsquo;s parcel data.</p>
<p><strong>Cost:</strong> Free.</p>

<h3>MLS (Multiple Listing Service)</h3>
<p>If you have MLS access (or work with an agent who does), filter to &ldquo;vacant land&rdquo; sales. MLS listings include more property details than recorder data &mdash; photos, agent remarks, days on market.</p>
<p><strong>Limitations:</strong> Not all land sales go through MLS. Private sales, auction sales, and off-market deals won&rsquo;t show up.</p>

<h3>REGRID and Parcel Data Platforms</h3>
<p>REGRID aggregates parcel-level data from counties nationwide. It&rsquo;s one of the most comprehensive sources for parcel boundaries, ownership, and recorded transactions.</p>
<p><strong>What you get:</strong> Parcel boundaries, ownership info, transaction history, assessed values.</p>
<p><strong>Limitations:</strong> Subscription pricing. Data completeness varies by county.</p>

<h3>Land Auction Platforms</h3>
<p>Sites that run land auctions publish results including final sale prices. These are useful comps, especially for lower-value rural parcels where auction sales represent a significant share of transactions.</p>
<p><strong>Caveat:</strong> Auction prices skew lower than private-market prices. Use them as a floor, not a ceiling.</p>

<h3>Super Plot Reports</h3>
<p>Super Plot pulls comparable sales automatically for any parcel. Comps are filtered by distance, recency, size, and zoning &mdash; and you see the raw data, not just a number.</p>

<h2>How to Qualify a Comp</h2>
<p>Not every nearby sale is a good comparable. Here&rsquo;s how to evaluate whether a comp belongs in your analysis.</p>

<h3>The 5 Comp Qualification Criteria</h3>
<p><strong>1. Distance: Closer is better.</strong> Ideal: within 5 miles. Acceptable: within 15&ndash;20 miles. Beyond 20 miles, the comp is probably in a different micro-market.</p>
<p><strong>2. Recency: Under 24 months.</strong> Land values shift, especially in growth areas. A comp from 3 years ago may reflect a different market. Prioritize sales from the last 12 months when available.</p>
<p><strong>3. Size similarity: Within 30&ndash;50% of your subject parcel.</strong> A 1-acre lot and a 40-acre parcel are different products selling to different buyers. Price per acre decreases as size increases.</p>
<p><strong>4. Zoning match.</strong> Residential-zoned land is a fundamentally different product than agricultural or commercial land. Always compare within the same zoning category.</p>
<p><strong>5. Similar access and utilities.</strong> A parcel on a paved road with utilities at the lot line is not comparable to a landlocked parcel requiring a well and septic system.</p>

<h2>How to Adjust Comps</h2>
<p>Once you have 3&ndash;5 qualified comps, adjust for differences. Common adjustments:</p>
<table>
<thead><tr><th>Factor</th><th>Adjustment Direction</th><th>Typical Impact</th></tr></thead>
<tbody>
<tr><td>Road access (paved vs. dirt vs. none)</td><td>Higher access = higher value</td><td>10&ndash;40%</td></tr>
<tr><td>Utilities at lot line vs. not available</td><td>Utilities present = higher value</td><td>10&ndash;25%</td></tr>
<tr><td>Topography (flat/buildable vs. steep/wetland)</td><td>Flat/buildable = higher value</td><td>10&ndash;30%</td></tr>
<tr><td>Flood zone (in vs. out)</td><td>Out of flood zone = higher value</td><td>15&ndash;30%</td></tr>
<tr><td>Proximity to town/amenities</td><td>Closer = higher value (usually)</td><td>5&ndash;20%</td></tr>
<tr><td>Time of sale (market conditions)</td><td>Rising market = upward adjustment</td><td>Varies</td></tr>
</tbody>
</table>

<h2>Worked Example: Pricing a 10-Acre Parcel in Texas</h2>
<p><strong>Subject parcel:</strong> 10 acres, Williamson County TX. AG-zoned, flat, no utilities, dirt road access. Seller asking $85,000.</p>
<p><strong>Comps found:</strong></p>
<table>
<thead><tr><th>Comp</th><th>Acres</th><th>Sale Price</th><th>$/Acre</th><th>Distance</th><th>Notes</th></tr></thead>
<tbody>
<tr><td>A</td><td>8.5</td><td>$72,000</td><td>$8,471</td><td>3 mi</td><td>Paved road, no utilities</td></tr>
<tr><td>B</td><td>12</td><td>$96,000</td><td>$8,000</td><td>7 mi</td><td>Dirt road, no utilities</td></tr>
<tr><td>C</td><td>10.2</td><td>$89,000</td><td>$8,725</td><td>5 mi</td><td>Paved road, electric at lot line</td></tr>
<tr><td>D</td><td>15</td><td>$97,500</td><td>$6,500</td><td>12 mi</td><td>Dirt road, no utilities</td></tr>
</tbody>
</table>
<p><strong>Adjusted average:</strong> ($7,624 + $8,000 + $6,980 + $6,825) &divide; 4 = <strong>$7,357/acre</strong></p>
<p><strong>Estimated value:</strong> 10 acres &times; $7,357 = <strong>$73,570</strong></p>
<p>The asking price of $85,000 appears 15% above the comp-adjusted estimate.</p>

<h2>Red Flags: Bad Comps That Distort Your Estimate</h2>
<ul>
<li><strong>Family/related-party sales</strong> &mdash; often recorded at $1 or well below market</li>
<li><strong>Foreclosure/tax sale comps</strong> &mdash; sold under distress, not market conditions</li>
<li><strong>Comps with structures</strong> &mdash; even a small shed or well can inflate the sale price</li>
<li><strong>Subdivision lot comps</strong> &mdash; a 0.5-acre lot in a platted subdivision is a different product than a 10-acre rural parcel</li>
<li><strong>Comps across county lines</strong> &mdash; different counties can have dramatically different tax rates, zoning rules, and market dynamics</li>
</ul>

<h2>Get Comps Automatically</h2>
<p>Super Plot generates comparable sales for any vacant parcel in the US. Enter an address or APN, and the report pulls recent sales filtered by distance, recency, size, and zoning &mdash; with the raw data so you can verify.</p>
<p>Basic reports are free. No account required.</p>
`,
  },
  {
    slug: "vacant-land-due-diligence-checklist",
    title:
      "Vacant Land Due Diligence Checklist: 12 Things to Check Before You Buy",
    metaDescription:
      "Don't buy land without checking these 12 items first. Complete due diligence checklist for vacant land — zoning, flood zones, access, utilities, environmental flags, and more.",
    targetKeyword: "vacant land due diligence",
    secondaryKeywords: [
      "vacant land due diligence checklist",
      "land buying checklist",
      "what to check before buying land",
      "raw land due diligence",
    ],
    publishedAt: "2026-04-05T00:00:00Z",
    updatedAt: "2026-04-05T00:00:00Z",
    excerpt:
      "Buying vacant land without proper due diligence is how investors lose money. This checklist covers the 12 items you need to verify before closing on any vacant land purchase.",
    content: `
<p>Buying vacant land without proper due diligence is how investors lose money. Unlike a house &mdash; where you can see the roof, test the plumbing, and walk the rooms &mdash; land problems are often invisible until they cost you.</p>
<p>A deal-killing flood zone. A zoning restriction that blocks your intended use. A parcel with no legal road access. These are not edge cases &mdash; they are common.</p>
<p>This checklist covers the 12 items you need to verify before closing on any vacant land purchase.</p>

<h2>The Checklist</h2>

<h3>1. Zoning and Permitted Uses</h3>
<p><strong>Why it matters:</strong> Zoning determines what you can legally do with the land. If you plan to build a home and the parcel is zoned agricultural-only, you have a problem.</p>
<p><strong>What to check:</strong></p>
<ul>
<li>Current zoning designation</li>
<li>Permitted uses (residential, agricultural, commercial, mixed)</li>
<li>Minimum lot size requirements</li>
<li>Setback requirements</li>
<li>Whether a variance or rezoning is feasible (and how long it takes)</li>
</ul>

<h3>2. Flood Zone Status</h3>
<p><strong>Why it matters:</strong> If the parcel is in a FEMA-designated flood zone, you may face mandatory flood insurance ($1,000&ndash;5,000+/year), building restrictions, reduced resale value, and difficulty getting financing.</p>
<p><strong>What to check:</strong></p>
<ul>
<li>FEMA Flood Insurance Rate Map (FIRM) for the parcel</li>
<li>Whether any portion falls in Zone A, AE, or VE</li>
<li>Whether the parcel has been previously flooded</li>
</ul>

<h3>3. Environmental Flags</h3>
<p><strong>Why it matters:</strong> Environmental contamination or protected habitats can make land unbuildable or create expensive remediation obligations.</p>
<p><strong>What to check:</strong></p>
<ul>
<li>Wetlands designation (National Wetlands Inventory)</li>
<li>EPA Superfund site proximity</li>
<li>Soil contamination history (Phase I ESA for larger purchases)</li>
<li>Endangered species habitat designations</li>
<li>State-level environmental restrictions</li>
</ul>

<h3>4. Legal Road Access</h3>
<p><strong>Why it matters:</strong> A parcel without legal road access is effectively landlocked. This can reduce value by 50&ndash;80%.</p>
<p><strong>What to check:</strong></p>
<ul>
<li>Does the parcel have direct frontage on a public road?</li>
<li>If not, is there a recorded access easement?</li>
<li>What type of road? (Paved county road vs. dirt/gravel vs. private road)</li>
<li>Is the road maintained by the county or private?</li>
</ul>

<h3>5. Utilities</h3>
<p><strong>Why it matters:</strong> The cost of bringing utilities to a parcel can range from $5,000 to $50,000+.</p>
<p><strong>What to check:</strong></p>
<ul>
<li>Electricity: Is there a power line at or near the lot line?</li>
<li>Water: Municipal water available, or will you need a well?</li>
<li>Sewer: Municipal sewer available, or will you need a septic system?</li>
<li>Internet/cell coverage</li>
</ul>

<h3>6. Title Search</h3>
<p><strong>Why it matters:</strong> Title issues can delay or kill a deal. You need clear title to close.</p>
<p><strong>What to check:</strong></p>
<ul>
<li>Current owner matches the seller</li>
<li>No outstanding liens (mortgages, tax liens, mechanic&rsquo;s liens, HOA liens)</li>
<li>No boundary disputes or overlapping claims</li>
<li>No restrictive covenants that limit your intended use</li>
<li>Chain of title is clean</li>
</ul>

<h3>7. Back Taxes</h3>
<p><strong>Why it matters:</strong> Unpaid property taxes create a lien on the property.</p>
<p><strong>What to check:</strong></p>
<ul>
<li>Are property taxes current?</li>
<li>How much are annual property taxes?</li>
<li>Any pending tax sale or redemption period?</li>
</ul>

<h3>8. Survey</h3>
<p><strong>Why it matters:</strong> The legal boundaries may not match the physical boundaries or GIS boundaries shown online.</p>
<p><strong>What to check:</strong></p>
<ul>
<li>Has a recent survey been done?</li>
<li>Do the lot dimensions match the deed description?</li>
<li>Are there any encroachments?</li>
</ul>
<p>A new survey costs $500&ndash;2,000 depending on size and terrain. Worth it for any purchase over $25,000.</p>

<h3>9. Topography and Soil</h3>
<p><strong>Why it matters:</strong> Steep slopes, rocky terrain, or poor soil can make building expensive or impossible.</p>
<p><strong>What to check:</strong></p>
<ul>
<li>General slope and grade</li>
<li>Soil type (will it support a foundation? A septic system?)</li>
<li>Drainage patterns</li>
<li>Any sinkholes, erosion, or geological instability</li>
</ul>

<h3>10. HOA, Deed Restrictions, and CC&amp;Rs</h3>
<p><strong>Why it matters:</strong> Even vacant land can be subject to HOA rules or deed restrictions that limit what you can build.</p>
<p><strong>What to check:</strong></p>
<ul>
<li>Is the parcel in an HOA?</li>
<li>Any CC&amp;Rs on the deed?</li>
<li>Minimum build requirements</li>
<li>Any use restrictions (no mobile homes, no commercial, etc.)</li>
</ul>

<h3>11. Mineral and Water Rights</h3>
<p><strong>Why it matters:</strong> Mineral rights and water rights can be separated from surface rights. If someone else owns the mineral rights, they may have the legal right to access and extract resources from your land.</p>
<p><strong>What to check:</strong></p>
<ul>
<li>Are mineral rights included in the sale?</li>
<li>Are water rights included?</li>
<li>Any active mining claims or leases?</li>
</ul>

<h3>12. Market Value Verification</h3>
<p><strong>Why it matters:</strong> After confirming the parcel is physically and legally sound, verify the asking price against market data.</p>
<p><strong>What to check:</strong></p>
<ul>
<li>Recent comparable sales (within 24 months, similar size/zoning/access)</li>
<li>Current listings for similar parcels</li>
<li>Price per acre trend in the area</li>
<li>Days on market for comparable listings</li>
</ul>

<h2>Common Surprises That Kill Deals</h2>
<ul>
<li><strong>Landlocked parcel with no easement.</strong> The seller &ldquo;always used the neighbor&rsquo;s driveway&rdquo; but there is no recorded easement.</li>
<li><strong>Flood zone covers 80% of the buildable area.</strong> The listing said &ldquo;partially in flood zone&rdquo; &mdash; partial can mean most of it.</li>
<li><strong>Zoning doesn&rsquo;t allow residential.</strong> The seller assumed you could build a house. The county says otherwise.</li>
<li><strong>$30,000 to bring electric to the lot.</strong> The power line is a mile away. Nobody mentioned it.</li>
<li><strong>Tax lien from 5 years ago.</strong> The seller thought their spouse paid it.</li>
</ul>
<p>Every one of these is avoidable with proper due diligence.</p>

<h2>Automate the Research Layer</h2>
<p>Super Plot generates a due diligence report on any vacant parcel in the US &mdash; zoning, flood zone, environmental flags, access, utilities, and comparable sales. In minutes, not hours.</p>
<p>The basic report is free. No account required.</p>
`,
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return blogPosts.map((p) => p.slug);
}

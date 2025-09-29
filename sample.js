const { MongoClient, ObjectId } = require('mongodb');

// Configuration
const MONGO_URI ='mongodb+srv://mctaruk_db_user:4Xp5LowINMERT2Vi@cluster0.btmahqm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const USER_ID = '68cd6c6fa352f4ac0c0ffddd';
const COVER_IMAGE_ID = '68cd6d10b65919298e572748';
const CATEGORY_ID = '68d23816a19c01e60effc289';

// Sample Events Data
const sampleEvents = [
  {
    _id: new ObjectId(),
    title: 'African Startup Pitch Night',
    description:
      'Join us for an exciting evening where emerging African startups will pitch their innovative ideas to a panel of experienced investors. This is a great opportunity for entrepreneurs to showcase their ventures and for investors to discover the next big thing in African tech.',
    coverImage: COVER_IMAGE_ID,
    type: 'Virtual',
    category: 'Pitch Event',
    location: 'https://zoom.us/j/123456789',
    startDate: new Date('2025-10-15'),
    endDate: new Date('2025-10-15'),
    startTime: '18:00',
    endTime: '21:00',
    zoomMeetingId: '123456789',
    createdByUserId: new ObjectId(USER_ID),
    attendeeCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: new ObjectId(),
    title: 'Tech Innovation Workshop: Building the Future',
    description:
      'A hands-on workshop focused on emerging technologies and their applications in solving real-world problems. Industry experts will share insights on AI, blockchain, IoT, and fintech innovations. Perfect for developers, entrepreneurs, and tech enthusiasts looking to stay ahead of the curve.',
    coverImage: COVER_IMAGE_ID,
    type: 'Hybrid',
    category: 'Workshop',
    location: 'Innovation Hub, Cape Town & Online',
    startDate: new Date('2025-11-02'),
    endDate: new Date('2025-11-02'),
    startTime: '09:00',
    endTime: '17:00',
    createdByUserId: new ObjectId(USER_ID),
    attendeeCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Sample Blog Articles Data
const sampleBlogs = [
  {
    _id: new ObjectId(),
    title:
      'The Rise of African Fintech: Transforming Financial Services Across the Continent',
    content: `<p>Africa's fintech sector has emerged as one of the most dynamic and rapidly growing industries on the continent. With innovative solutions addressing long-standing financial inclusion challenges, African fintech companies are revolutionizing how people access and use financial services.</p>

<h2>The Current Landscape</h2>
<p>The African fintech ecosystem has witnessed unprecedented growth over the past decade. Countries like <strong>Nigeria</strong>, <strong>Kenya</strong>, and <strong>South Africa</strong> have become major hubs for financial innovation, with startups creating solutions that serve both the banked and unbanked populations.</p>

<h3>Key Success Stories</h3>
<ul>
<li><strong>Mobile Money Revolution:</strong> Platforms like M-Pesa have shown the world how mobile technology can drive financial inclusion</li>
<li><strong>Digital Banking:</strong> Neo-banks are providing banking services to previously underserved populations</li>
<li><strong>Payment Solutions:</strong> Innovative payment platforms are facilitating cross-border transactions and e-commerce growth</li>
</ul>

<h2>Investment Trends</h2>
<p>Venture capital investment in African fintech has surged, with investors recognizing the massive potential of the market. <em>According to recent reports, fintech startups across Africa raised over $800 million in 2024</em>, demonstrating strong investor confidence in the sector.</p>

<blockquote>
<p>"The African fintech sector represents one of the most exciting investment opportunities globally, with innovative solutions addressing real market needs." - Industry Expert</p>
</blockquote>

<h3>Looking Forward</h3>
<p>As the sector continues to mature, we can expect to see:</p>
<ol>
<li>Increased regulatory clarity and support</li>
<li>Greater integration with traditional financial institutions</li>
<li>Expansion of services beyond payments to include lending, insurance, and wealth management</li>
<li>Enhanced focus on cybersecurity and data protection</li>
</ol>

<p>The future of African fintech looks incredibly promising, with continued innovation and investment set to drive further growth and financial inclusion across the continent.</p>`,
    author: new ObjectId(USER_ID),
    coverPhotoId: COVER_IMAGE_ID,
    views: 0,
    category: new ObjectId(CATEGORY_ID),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: new ObjectId(),
    title: 'Building Sustainable Startups: Lessons from African Entrepreneurs',
    content: `<p>The African startup ecosystem has produced numerous success stories, but building a sustainable business in challenging environments requires unique strategies and approaches. This article explores key lessons from successful African entrepreneurs who have built thriving companies despite various obstacles.</p>

<h2>Understanding the Market</h2>
<p>One of the most critical factors for startup success in Africa is <strong>deep market understanding</strong>. Successful entrepreneurs emphasize the importance of:</p>

<ul>
<li>Conducting extensive local market research</li>
<li>Understanding cultural nuances and preferences</li>
<li>Identifying unique pain points that global solutions might miss</li>
<li>Building solutions that work within existing infrastructure constraints</li>
</ul>

<h3>Resource Optimization</h3>
<p>African startups often operate with limited resources, making <em>resource optimization</em> a crucial skill. Successful companies have mastered:</p>

<blockquote>
<p>"We learned to do more with less, which actually made us more innovative and efficient than our global counterparts." - Successful African Entrepreneur</p>
</blockquote>

<h2>Key Success Strategies</h2>

<h3>1. Local Partnerships</h3>
<p>Building strong relationships with local partners, suppliers, and distributors has proven essential for scaling across different African markets. These partnerships provide:</p>
<ul>
<li>Local market knowledge and credibility</li>
<li>Distribution channels and customer access</li>
<li>Regulatory and compliance support</li>
</ul>

<h3>2. Adaptable Business Models</h3>
<p>Successful startups in Africa often employ <strong>flexible business models</strong> that can adapt to different market conditions and customer segments. This includes:</p>
<ol>
<li>Multiple revenue streams</li>
<li>Scalable technology platforms</li>
<li>Diverse customer acquisition channels</li>
<li>Agile product development processes</li>
</ol>

<h3>3. Community-Centric Approach</h3>
<p>Many successful African startups have built their businesses around <em>community needs and values</em>. This approach has led to:</p>
<ul>
<li>Higher customer loyalty and retention</li>
<li>Organic word-of-mouth marketing</li>
<li>Stronger brand recognition and trust</li>
<li>Sustainable long-term growth</li>
</ul>

<h2>Overcoming Challenges</h2>
<p>While the African startup landscape presents unique opportunities, entrepreneurs must navigate various challenges including:</p>

<table border="1" style="border-collapse: collapse; width: 100%;">
<tr>
<th style="padding: 8px; background-color: #f2f2f2;">Challenge</th>
<th style="padding: 8px; background-color: #f2f2f2;">Solution Approach</th>
</tr>
<tr>
<td style="padding: 8px;">Limited access to funding</td>
<td style="padding: 8px;">Focus on revenue generation early, seek alternative funding sources</td>
</tr>
<tr>
<td style="padding: 8px;">Infrastructure constraints</td>
<td style="padding: 8px;">Build offline-capable solutions, leverage mobile-first approaches</td>
</tr>
<tr>
<td style="padding: 8px;">Regulatory complexity</td>
<td style="padding: 8px;">Engage early with regulators, build compliance into product design</td>
</tr>
</table>

<h2>The Path Forward</h2>
<p>As the African startup ecosystem continues to evolve, entrepreneurs who focus on <strong>sustainability</strong>, <strong>community impact</strong>, and <strong>innovative problem-solving</strong> will be best positioned for long-term success.</p>

<p>The lessons learned from current successful African entrepreneurs provide a roadmap for the next generation of startups looking to make a meaningful impact while building profitable, sustainable businesses.</p>`,
    author: new ObjectId(USER_ID),
    coverPhotoId: COVER_IMAGE_ID,
    views: 0,
    category: new ObjectId(CATEGORY_ID),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: new ObjectId(),
    title: 'The Future of Remote Work in African Tech Companies',
    content: `<p>The COVID-19 pandemic accelerated the adoption of remote work globally, and African tech companies have been at the forefront of this transformation. As we look toward the future, remote work is reshaping how African tech companies operate, hire, and scale their businesses.</p>

<h2>The Remote Work Revolution</h2>
<p>Before 2020, remote work was still a relatively uncommon practice across Africa. However, the pandemic forced a rapid shift that has had lasting impacts:</p>

<ul>
<li><strong>Talent Access:</strong> Companies can now hire the best talent regardless of location</li>
<li><strong>Cost Efficiency:</strong> Reduced overhead costs from office spaces and utilities</li>
<li><strong>Work-Life Balance:</strong> Improved employee satisfaction and retention</li>
<li><strong>Global Reach:</strong> Easier collaboration with international partners and clients</li>
</ul>

<h3>Success Stories</h3>
<p>Several African tech companies have successfully transitioned to <em>fully remote or hybrid models</em>:</p>

<blockquote>
<p>"Going remote allowed us to tap into talent pools we never had access to before, while significantly reducing our operational costs." - CTO of a leading African fintech company</p>
</blockquote>

<h2>Challenges and Solutions</h2>

<h3>Infrastructure Constraints</h3>
<p>One of the biggest challenges facing remote work in Africa is <strong>internet connectivity</strong>. Companies have addressed this through:</p>
<ol>
<li>Providing internet allowances to employees</li>
<li>Setting up satellite offices in areas with better connectivity</li>
<li>Investing in mobile-first communication tools</li>
<li>Creating flexible working arrangements around connectivity issues</li>
</ol>

<h3>Cultural Adaptation</h3>
<p>Adapting to remote work culture has required significant changes in management approaches:</p>

<table border="1" style="border-collapse: collapse; width: 100%;">
<tr>
<th style="padding: 8px; background-color: #f2f2f2;">Traditional Approach</th>
<th style="padding: 8px; background-color: #f2f2f2;">Remote Work Adaptation</th>
</tr>
<tr>
<td style="padding: 8px;">Physical presence = productivity</td>
<td style="padding: 8px;">Results-oriented performance measurement</td>
</tr>
<tr>
<td style="padding: 8px;">In-person meetings</td>
<td style="padding: 8px;">Structured virtual collaboration</td>
</tr>
<tr>
<td style="padding: 8px;">Hierarchical communication</td>
<td style="padding: 8px;">Open, transparent digital communication</td>
</tr>
</table>

<h2>Tools and Technologies</h2>
<p>African tech companies have embraced various tools to facilitate remote work:</p>

<h3>Communication Platforms</h3>
<ul>
<li><strong>Slack</strong> and <strong>Microsoft Teams</strong> for team communication</li>
<li><strong>Zoom</strong> and <strong>Google Meet</strong> for video conferencing</li>
<li><strong>WhatsApp Business</strong> for quick, mobile-friendly communication</li>
</ul>

<h3>Project Management</h3>
<ul>
<li><em>Asana</em> and <em>Trello</em> for task management</li>
<li><em>Jira</em> for software development workflows</li>
<li><em>Notion</em> for documentation and knowledge sharing</li>
</ul>

<h2>The Hybrid Future</h2>
<p>Many African tech companies are now adopting <strong>hybrid models</strong> that combine the benefits of remote work with occasional in-person collaboration:</p>

<blockquote>
<p>"We've found that a hybrid approach gives us the flexibility of remote work while maintaining the team cohesion that comes from face-to-face interaction." - CEO of a Nigerian edtech startup</p>
</blockquote>

<h3>Best Practices for Hybrid Work</h3>
<ol>
<li><strong>Clear Communication Protocols:</strong> Establish when and how team members should communicate</li>
<li><strong>Regular Check-ins:</strong> Schedule consistent one-on-ones and team meetings</li>
<li><strong>Results-Based Performance:</strong> Focus on outcomes rather than hours worked</li>
<li><strong>Digital-First Documentation:</strong> Ensure all important information is accessible online</li>
<li><strong>Inclusive Meeting Practices:</strong> Make sure remote participants are fully included</li>
</ol>

<h2>Looking Ahead</h2>
<p>The future of work in African tech will likely be characterized by:</p>

<ul>
<li>Continued investment in digital infrastructure</li>
<li>More sophisticated remote work policies and practices</li>
<li>Greater emphasis on employee well-being and mental health</li>
<li>Expansion of talent pools across continental boundaries</li>
<li>Innovation in remote collaboration technologies</li>
</ul>

<p>As African tech companies continue to refine their remote work strategies, they're not just adapting to global trends—they're pioneering new approaches that could influence the future of work worldwide.</p>`,
    author: new ObjectId(USER_ID),
    coverPhotoId: COVER_IMAGE_ID,
    views: 0,
    category: new ObjectId(CATEGORY_ID),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

async function insertSampleData() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();

    // Insert sample events
    console.log('Inserting sample events...');
    const eventsResult = await db.collection('events').insertMany(sampleEvents);
    console.log(`✅ Inserted ${eventsResult.insertedCount} events`);

    // Insert sample blog articles
    console.log('Inserting sample blog articles...');
    const blogsResult = await db.collection('blogs').insertMany(sampleBlogs);
    console.log(`✅ Inserted ${blogsResult.insertedCount} blog articles`);

    console.log('\n📊 Summary:');
    console.log(`Events created: ${eventsResult.insertedCount}`);
    console.log(`Blog articles created: ${blogsResult.insertedCount}`);

    // Display created IDs
    console.log('\n🆔 Created Event IDs:');
    Object.values(eventsResult.insertedIds).forEach((id, index) => {
      console.log(`  ${index + 1}. ${id}`);
    });

    console.log('\n🆔 Created Blog Article IDs:');
    Object.values(blogsResult.insertedIds).forEach((id, index) => {
      console.log(`  ${index + 1}. ${id}`);
    });
  } catch (error) {
    console.error('Error inserting sample data:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  insertSampleData();
}

module.exports = { insertSampleData, sampleEvents, sampleBlogs };

# Getting started with Vercel Web Analytics

This guide helps you understand how Vercel Web Analytics is integrated into the PDF Tools Pro project.

## Overview

Vercel Web Analytics is now enabled for this project. It provides insights into your application's performance and user interactions without compromising privacy. All data collection is privacy-first and complies with GDPR and other data protection regulations.

## What is Enabled

Vercel Web Analytics has been added to all HTML pages of the PDF Tools Pro application:
- `index.html` - Home page
- `pdf-to-images.html` - PDF to Images converter
- `image-to-pdf.html` - Image to PDF converter
- `about.html` - About page
- `contact.html` - Contact page
- `privacy.html` - Privacy policy page
- `terms.html` - Terms of service page

## Implementation Details

### Plain HTML Implementation

Since this is a static HTML/JavaScript project, Vercel Web Analytics uses the plain HTML implementation. The analytics script has been added to the `<head>` section of each HTML file:

```html
<!-- Vercel Web Analytics -->
<script>
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
</script>
<script defer src="/_vercel/insights/script.js"></script>
```

### How It Works

1. The first script defines a `window.va` function that queues analytics events
2. The second script (loaded asynchronously with `defer`) loads the actual Vercel Insights tracking script from `/_vercel/insights/script.js`
3. When deployed to Vercel, this route is automatically created and serves the tracking script

### What Data is Collected

Vercel Web Analytics automatically collects:
- **Page views** - Which pages users visit
- **Core Web Vitals** - Performance metrics (LCP, FID, CLS)
- **Referrers** - Where traffic comes from
- **Browser information** - Device type and browser
- **Geographic data** - General location (country/city level)

### Privacy First

Vercel Web Analytics is designed with privacy in mind:
- **No personally identifiable information** - No names, emails, or IP addresses are stored
- **No cookies** - Does not use tracking cookies
- **GDPR compliant** - Meets GDPR requirements without requiring cookie consent
- **Data retention** - Data is kept for a reasonable time and then deleted
- **Transparent** - No hidden tracking or scripts

## Prerequisites

To use Vercel Web Analytics with this project, you need:

1. **A Vercel account** - Sign up at [vercel.com](https://vercel.com/signup)
2. **A Vercel project** - Create one at [vercel.com/new](https://vercel.com/new)
3. **The Vercel CLI** (optional) - For local development:
   ```bash
   npm i -g vercel
   # or
   pnpm i -g vercel
   # or
   yarn global add vercel
   # or
   bun i -g vercel
   ```

## Enabling Web Analytics on Vercel

1. Go to your [Vercel dashboard](https://vercel.com/dashboard)
2. Select your project (PDF Tools Pro)
3. Navigate to the **Analytics** tab
4. Click the **Enable** button
5. Your analytics will start collecting data on the next deployment

## Deployment

To deploy this project with Vercel Web Analytics:

### Using Vercel CLI

```bash
vercel deploy
```

### Using Git Integration (Recommended)

1. Connect your Git repository to Vercel
2. Push your changes to the main branch
3. Vercel will automatically deploy and enable analytics

## Accessing Your Analytics Data

Once deployed and enabled:

1. Go to your [Vercel dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click the **Analytics** tab
4. View your data including:
   - Real-time page views
   - Core Web Vitals metrics
   - Geographic distribution
   - Device and browser breakdown
   - Top pages
   - Referrer sources

## Important Notes

### Route Scoping

When Web Analytics is enabled, new routes are automatically created at `/_vercel/insights/*` after your next deployment. These routes are:
- **Read-only** - They only serve analytics data
- **Automatically managed** - You don't need to create them
- **Scoped** - They don't interfere with your application routes

### No Configuration Needed for This Project

Since this project uses the plain HTML implementation:
- ✅ No need to install `@vercel/analytics` package
- ✅ No configuration files needed
- ✅ No framework-specific setup required
- ✅ Works with any static hosting, not just Vercel

### Framework-Specific Alternatives

If you ever migrate this project to a framework (Next.js, React, Vue, etc.), you should:
1. Install the framework-specific package: `npm install @vercel/analytics`
2. Import and add the Analytics component according to the framework
3. Remove the plain HTML implementation from the `<head>` tags

For framework-specific instructions, see the [official Vercel Analytics documentation](https://vercel.com/docs/analytics).

## Custom Events (Pro and Enterprise Plans)

Users on Pro and Enterprise plans can track custom events to monitor user interactions:
- Button clicks
- Form submissions
- Feature usage
- Conversions
- Custom business metrics

For more information, visit the [custom events documentation](https://vercel.com/docs/analytics/custom-events).

## Data Filtering and Reports

Once you have data, you can:
- **Filter data** - By time period, device type, location, etc.
- **View reports** - See pre-built reports and metrics
- **Export data** - For further analysis
- **Set up alerts** - Get notified of anomalies

See the [filtering documentation](https://vercel.com/docs/analytics/filtering) for more details.

## Troubleshooting

### Analytics Not Working

If you don't see data after deployment:

1. **Check deployment** - Ensure the project is deployed to Vercel
2. **Check enablement** - Verify Web Analytics is enabled in the dashboard
3. **Check network** - Open browser DevTools and look for requests to `/_vercel/insights/view`
4. **Wait for data** - It may take a few minutes for data to appear

### Issues with Specific Pages

- Clear browser cache and reload
- Check the console for errors
- Verify the script is present in the page's `<head>`

## Next Steps

Now that Vercel Web Analytics is set up:

1. **Deploy your project** - Push to Vercel to start collecting data
2. **Monitor performance** - Check Core Web Vitals and page speed
3. **Analyze user behavior** - Understand which pages are most popular
4. **Optimize** - Use insights to improve your site
5. **Explore pro features** - Consider Pro plan for custom events

## Additional Resources

- [Vercel Analytics Documentation](https://vercel.com/docs/analytics)
- [Privacy and Compliance](https://vercel.com/docs/analytics/privacy-policy)
- [Limits and Pricing](https://vercel.com/docs/analytics/limits-and-pricing)
- [Custom Events Guide](https://vercel.com/docs/analytics/custom-events)
- [Filtering Data](https://vercel.com/docs/analytics/filtering)
- [Troubleshooting Guide](https://vercel.com/docs/analytics/troubleshooting)

## Questions?

For more information about Vercel Web Analytics:
- Visit the [Vercel Documentation](https://vercel.com/docs)
- Check the [support center](https://support.vercel.com)
- Visit our [contact page](./contact.html)

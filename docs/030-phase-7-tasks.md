# Phase 7: Production Deployment - Task Breakdown

## Overview
Complete task-oriented breakdown for deploying the Milestone P&L Dashboard to production using Coolify on Ubuntu server with Docker internal_net networking.

## Prerequisites Check
**T274-Deployment Prerequisites**: Verify requirements
- Confirm Phase 1-6 complete
- Check application builds successfully
- Verify all tests pass
- Review deployment checklist
- Dependencies: Phase 1-6 Complete
- Estimated Time: 5 minutes

## Infrastructure Setup

**T275-Verify Coolify Installation**: Check server setup
- SSH to Ubuntu server
- Verify Coolify is running
- Check Docker is installed
- Verify internal_net exists
- Dependencies: T274
- Estimated Time: 5 minutes

**T276-Access PostgreSQL Container**: Connect to existing database
- Identify PostgreSQL container name
- Test Docker network connectivity
- Verify internal_net access
- Note container hostname
- Dependencies: T275
- Estimated Time: 5 minutes

**T277-Create Application Database**: Set up milestone_db
- Connect to PostgreSQL container
- Create milestone_db database
- Create milestone_app user
- Grant permissions
- Dependencies: T276
- Estimated Time: 5 minutes

## Database Migration

**T278-Create Migration Scripts**: Prepare production migrations
- Create `drizzle/` directory
- Add production setup script
- Add indexes creation script
- Add audit triggers
- Dependencies: T277
- Estimated Time: 10 minutes

**T279-Configure Database Roles**: Set up access control
- Create milestone schema
- Create xero_reader role
- Grant appropriate permissions
- Enable UUID extension
- Dependencies: T278
- Estimated Time: 8 minutes

**T280-Run Initial Migration**: Apply schema to production
- Execute Drizzle migrations
- Create performance indexes
- Create audit_log table
- Verify all objects created
- Dependencies: T279
- Estimated Time: 10 minutes

**T281-Test Database Connection**: Verify Docker networking
- Test connection via internal_net
- Verify no external exposure
- Check connection pooling
- Test from app container
- Dependencies: T280
- Estimated Time: 5 minutes

## Environment Configuration

**T282-Prepare Production Environment**: Set up env variables
- Create production env list
- Update Clerk to production keys
- Set production database URL
- Configure app URL
- Dependencies: T281
- Estimated Time: 5 minutes

**T283-Configure Clerk Production**: Set up production auth
- Create production instance in Clerk
- Configure production URLs
- Set up production webhooks
- Test authentication flow
- Dependencies: T282
- Estimated Time: 10 minutes

**T284-Create Environment Documentation**: Document all variables
- List all required variables
- Document format for each
- Add example values
- Note security considerations
- Dependencies: T283
- Estimated Time: 5 minutes

## Coolify Application Setup

**T285-Create Coolify Application**: Initialize deployment
- Access Coolify dashboard
- Create new application
- Select GitHub source
- Connect repository
- Dependencies: T284
- Estimated Time: 5 minutes

**T286-Configure Docker Network**: Set up networking
- Select internal_net network
- Configure container name
- Set port to 3000
- Disable external exposure
- Dependencies: T285
- Estimated Time: 5 minutes

**T287-Add Environment Variables**: Configure Coolify env
- Add DATABASE_URL with internal hostname
- Add Clerk production keys
- Set NEXT_PUBLIC_BASE_PATH=/milestone-app
- Add NODE_ENV=production
- Dependencies: T286
- Estimated Time: 8 minutes

**T288-Configure Domain**: Set up subdirectory routing
- Set domain: dashboard.innspiredaccountancy.com
- Set path: /milestone-app
- Configure health check path
- Verify SSL certificate active
- Dependencies: T287
- Estimated Time: 5 minutes

## Security Configuration

**T289-Configure Security Headers**: Add security headers
- Update next.config.js
- Add CSP headers
- Add HSTS header
- Add X-Frame-Options
- Test header application
- Dependencies: T288
- Estimated Time: 10 minutes

**T290-Implement Rate Limiting**: Add API protection
- Create rate limit middleware
- Configure limits per endpoint
- Add IP-based limiting
- Test rate limiting
- Dependencies: T289
- Estimated Time: 10 minutes

**T291-Configure CORS**: Set up cross-origin policies
- Define allowed origins
- Configure methods
- Set allowed headers
- Test CORS policies
- Dependencies: T290
- Estimated Time: 5 minutes

**T292-Add Input Validation**: Strengthen validation
- Review all API endpoints
- Add Zod validation
- Sanitize user inputs
- Test edge cases
- Dependencies: T291
- Estimated Time: 10 minutes

## Monitoring Setup

**T293-Configure Basic Logging**: Set up application logging
- Create Logger class
- Add error logging
- Add audit logging to database
- Test log output in Coolify
- Dependencies: T292
- Estimated Time: 8 minutes

**T294-Set Up Coolify Monitoring**: Configure container monitoring
- Enable health checks
- Set check interval (30s)
- Configure auto-restart
- Monitor resource usage
- Dependencies: T293
- Estimated Time: 5 minutes

**T295-Create Admin Dashboard**: Add simple admin page
- Create /admin route
- Add basic stats queries
- Display user count
- Show recent activity
- Dependencies: T294
- Estimated Time: 10 minutes

**T296-Create Health Check**: Add monitoring endpoint
- Create `/api/health` route
- Check database connection
- Return JSON status
- Configure in Coolify
- Dependencies: T295
- Estimated Time: 5 minutes

## Coolify Deployment

**T297-Configure Auto-Deploy**: Set up automatic deployment
- Enable auto-deploy in Coolify
- Set deploy branch to main
- Configure build cache
- Test auto-deploy trigger
- Dependencies: T296
- Estimated Time: 5 minutes

**T298-Set Build Commands**: Configure build process
- Set install: npm ci --production=false
- Set build: npm run build
- Set start: npm run start
- Test build process
- Dependencies: T297
- Estimated Time: 5 minutes

**T299-Create Pre-Deploy Script**: Add deployment checks
- Create scripts/pre-deploy.sh
- Add TypeScript check
- Add linting check
- Add build test
- Dependencies: T298
- Estimated Time: 8 minutes

**T300-Test Deployment**: Verify deployment works
- Push code to main branch
- Monitor Coolify logs
- Check build success
- Verify container starts
- Dependencies: T299
- Estimated Time: 5 minutes

**T301-Configure Rollback**: Plan failure recovery
- Document Coolify rollback
- Note previous deployments
- Test rollback in Coolify
- Document recovery steps
- Dependencies: T300
- Estimated Time: 5 minutes

## Performance Optimization

**T302-Configure Caching**: Set up cache strategies
- Configure Vercel edge caching
- Set cache headers
- Configure CDN
- Test cache effectiveness
- Dependencies: T301
- Estimated Time: 8 minutes

**T303-Optimize Images**: Improve image delivery
- Configure Next.js Image optimization
- Set up image domains
- Test image loading
- Monitor performance
- Dependencies: T302
- Estimated Time: 5 minutes

**T304-Enable Compression**: Reduce payload sizes
- Enable gzip compression
- Configure Brotli if available
- Test compression ratios
- Monitor bandwidth usage
- Dependencies: T303
- Estimated Time: 5 minutes

**T305-Optimize Bundle Size**: Reduce JavaScript size
- Analyze bundle composition
- Remove unused dependencies
- Enable tree shaking
- Test load performance
- Dependencies: T304
- Estimated Time: 10 minutes

## Database Optimization

**T306-Create Database Indexes**: Optimize queries
- Identify slow queries
- Create appropriate indexes
- Test query performance
- Monitor index usage
- Dependencies: T305
- Estimated Time: 10 minutes

**T307-Set Up Materialized Views**: Optimize aggregations
- Create dashboard metrics view
- Set up refresh schedule
- Test view performance
- Monitor refresh times
- Dependencies: T306
- Estimated Time: 8 minutes

**T308-Configure Backup Strategy**: Set up data protection
- Configure automated backups
- Set retention policy
- Test restore process
- Document recovery procedure
- Dependencies: T307
- Estimated Time: 10 minutes

## Testing in Production

**T309-Smoke Test Core Features**: Verify basic functionality
- Test authentication flow
- Test dashboard loading
- Test project navigation
- Test data display
- Dependencies: T308
- Estimated Time: 8 minutes

**T310-Test Export Functionality**: Verify exports work
- Test PDF generation
- Test Excel export
- Check file downloads
- Verify data accuracy
- Dependencies: T309
- Estimated Time: 5 minutes

**T311-Test API Endpoints**: Verify API functionality
- Test all endpoints
- Check authentication
- Verify rate limiting
- Test error handling
- Dependencies: T310
- Estimated Time: 8 minutes

**T312-Load Testing**: Verify performance under load
- Use load testing tool
- Simulate concurrent users
- Monitor response times
- Identify bottlenecks
- Dependencies: T311
- Estimated Time: 10 minutes

## Documentation

**T313-Create Deployment Guide**: Document deployment process
- List all steps
- Include prerequisites
- Add troubleshooting
- Document rollback
- Dependencies: T312
- Estimated Time: 10 minutes

**T314-Create Operations Runbook**: Document operations
- List common tasks
- Document procedures
- Add emergency contacts
- Include escalation paths
- Dependencies: T313
- Estimated Time: 10 minutes

**T315-Create Architecture Diagram**: Document system design
- Draw component diagram
- Show data flow
- Document integrations
- Include network topology
- Dependencies: T314
- Estimated Time: 8 minutes

## Monitoring Configuration

**T316-Set Up Alerts**: Configure monitoring alerts
- Configure error rate alerts
- Set up downtime alerts
- Add performance alerts
- Configure notification channels
- Dependencies: T315
- Estimated Time: 8 minutes

**T317-Create Dashboard**: Build monitoring dashboard
- Set up metrics dashboard
- Add key indicators
- Configure refresh rates
- Share with team
- Dependencies: T316
- Estimated Time: 5 minutes

**T318-Configure Logging**: Set up centralized logging
- Choose logging service
- Configure log aggregation
- Set retention policies
- Create log queries
- Dependencies: T317
- Estimated Time: 8 minutes

## Security Audit

**T319-Run Security Scan**: Check for vulnerabilities
- Run dependency audit
- Check for known CVEs
- Scan for secrets
- Review security headers
- Dependencies: T318
- Estimated Time: 5 minutes

**T320-Review Permissions**: Audit access control
- Review database permissions
- Check API authentication
- Verify role-based access
- Document permissions matrix
- Dependencies: T319
- Estimated Time: 8 minutes

**T321-Test Security Measures**: Verify protections
- Test rate limiting
- Verify input validation
- Check CSRF protection
- Test XSS prevention
- Dependencies: T320
- Estimated Time: 10 minutes

## Go-Live Preparation

**T322-Create Launch Checklist**: Final verification list
- List all critical checks
- Verify all features work
- Check monitoring active
- Confirm backups configured
- Dependencies: T321
- Estimated Time: 5 minutes

**T323-Prepare Rollback Plan**: Document contingency
- Create rollback checklist
- Test rollback locally
- Document timing
- Assign responsibilities
- Dependencies: T322
- Estimated Time: 5 minutes

**T324-Schedule Maintenance Window**: Plan deployment
- Choose low-traffic time
- Notify stakeholders
- Prepare status page
- Set expectations
- Dependencies: T323
- Estimated Time: 3 minutes

## Go-Live Execution

**T325-Deploy to Production**: Execute deployment
- Run deployment command
- Monitor deployment progress
- Verify successful completion
- Check application starts
- Dependencies: T324
- Estimated Time: 10 minutes

**T326-Verify Production**: Confirm functionality
- Test authentication
- Check data display
- Verify all pages load
- Test critical paths
- Dependencies: T325
- Estimated Time: 10 minutes

**T327-Monitor Initial Hours**: Watch for issues
- Monitor error rates
- Check performance metrics
- Review user feedback
- Address urgent issues
- Dependencies: T326
- Estimated Time: 30 minutes

## Post-Deployment

**T328-Document Lessons Learned**: Capture improvements
- Note what went well
- Document issues faced
- List improvements
- Update procedures
- Dependencies: T327
- Estimated Time: 10 minutes

**T329-Update Documentation**: Finalize docs
- Update README
- Update deployment guide
- Add production URLs
- Archive old docs
- Dependencies: T328
- Estimated Time: 5 minutes

**T330-Phase Completion Check**: Final verification
- Verify application live
- Check all monitoring active
- Confirm backups running
- Sign off deployment
- Dependencies: T329
- Estimated Time: 5 minutes

---

## Summary
- Total Tasks: 57 (T274-T330)
- Estimated Total Time: 8-9 hours (plus monitoring time)
- Critical Path: T274 → T275-T277 → T278-T281 → T282-T288 → T289-T296 → T297-T308 → T309-T324 → T325-T330

## Success Criteria
- [ ] Application deployed via Coolify
- [ ] Database accessible via Docker internal_net
- [ ] Subdirectory routing (/milestone-app) working
- [ ] Security headers and rate limiting active
- [ ] Basic logging and monitoring configured
- [ ] Auto-deploy from GitHub operational
- [ ] Docker-based backups automated
- [ ] All features working in production
- [ ] Documentation complete
- [ ] Simple admin dashboard available
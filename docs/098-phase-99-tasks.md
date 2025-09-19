# Phase 99: Production Deployment - Task Breakdown

## Overview
Complete task-oriented breakdown for deploying the Milestone P&L Dashboard to production using Coolify on Ubuntu server with Docker internal_net networking.

## Prerequisites Check
**T900-Deployment Prerequisites**: Verify requirements
- Confirm Phase 1-6 complete
- Check application builds successfully
- Verify all tests pass
- Review deployment checklist
- Dependencies: Phase 1-6 Complete
- Estimated Time: 5 minutes

## Infrastructure Setup

**T901-Verify Coolify Installation**: Check server setup
- SSH to Ubuntu server
- Verify Coolify is running
- Check Docker is installed
- Verify internal_net exists
- Dependencies: T900
- Estimated Time: 5 minutes

**T902-Access PostgreSQL Container**: Connect to existing database
- Identify PostgreSQL container name
- Test Docker network connectivity
- Verify internal_net access
- Note container hostname
- Dependencies: T901
- Estimated Time: 5 minutes

**T903-Create Application Database**: Set up milestone_db
- Connect to PostgreSQL container
- Create milestone_db database
- Create milestone_app user
- Grant permissions
- Dependencies: T902
- Estimated Time: 5 minutes

## Database Migration

**T904-Create Migration Scripts**: Prepare production migrations
- Create `drizzle/` directory
- Add production setup script
- Add indexes creation script
- Add audit triggers
- Dependencies: T903
- Estimated Time: 10 minutes

**T905-Configure Database Roles**: Set up access control
- Create milestone schema
- Create xero_reader role
- Grant appropriate permissions
- Enable UUID extension
- Dependencies: T904
- Estimated Time: 8 minutes

**T906-Run Initial Migration**: Apply schema to production
- Execute Drizzle migrations
- Create performance indexes
- Create audit_log table
- Verify all objects created
- Dependencies: T905
- Estimated Time: 10 minutes

**T907-Test Database Connection**: Verify Docker networking
- Test connection via internal_net
- Verify no external exposure
- Check connection pooling
- Test from app container
- Dependencies: T906
- Estimated Time: 5 minutes

## Environment Configuration

**T908-Prepare Production Environment**: Set up env variables
- Create production env list
- Update Clerk to production keys
- Set production database URL
- Configure app URL
- Dependencies: T907
- Estimated Time: 5 minutes

**T909-Configure Clerk Production**: Set up production auth
- Create production instance in Clerk
- Configure production URLs
- Set up production webhooks
- Test authentication flow
- Dependencies: T908
- Estimated Time: 10 minutes

**T910-Create Environment Documentation**: Document all variables
- List all required variables
- Document format for each
- Add example values
- Note security considerations
- Dependencies: T909
- Estimated Time: 5 minutes

## Coolify Application Setup

**T911-Create Coolify Application**: Initialize deployment
- Access Coolify dashboard
- Create new application
- Select GitHub source
- Connect repository
- Dependencies: T910
- Estimated Time: 5 minutes

**T912-Configure Docker Network**: Set up networking
- Select internal_net network
- Configure container name
- Set port to 3000
- Disable external exposure
- Dependencies: T911
- Estimated Time: 5 minutes

**T913-Add Environment Variables**: Configure Coolify env
- Add DATABASE_URL with internal hostname
- Add Clerk production keys
- Set NEXT_PUBLIC_BASE_PATH=/milestone-app
- Add NODE_ENV=production
- Dependencies: T912
- Estimated Time: 8 minutes

**T914-Configure Domain**: Set up subdirectory routing
- Set domain: dashboard.innspiredaccountancy.com
- Set path: /milestone-app
- Configure health check path
- Verify SSL certificate active
- Dependencies: T913
- Estimated Time: 5 minutes

## Security Configuration

**T915-Configure Security Headers**: Add security headers
- Update next.config.js
- Add CSP headers
- Add HSTS header
- Add X-Frame-Options
- Test header application
- Dependencies: T914
- Estimated Time: 10 minutes

**T916-Implement Rate Limiting**: Add API protection
- Create rate limit middleware
- Configure limits per endpoint
- Add IP-based limiting
- Test rate limiting
- Dependencies: T915
- Estimated Time: 10 minutes

**T917-Configure CORS**: Set up cross-origin policies
- Define allowed origins
- Configure methods
- Set allowed headers
- Test CORS policies
- Dependencies: T916
- Estimated Time: 5 minutes

**T918-Add Input Validation**: Strengthen validation
- Review all API endpoints
- Add Zod validation
- Sanitize user inputs
- Test edge cases
- Dependencies: T917
- Estimated Time: 10 minutes

## Monitoring Setup

**T919-Configure Basic Logging**: Set up application logging
- Create Logger class
- Add error logging
- Add audit logging to database
- Test log output in Coolify
- Dependencies: T918
- Estimated Time: 8 minutes

**T920-Set Up Coolify Monitoring**: Configure container monitoring
- Enable health checks
- Set check interval (30s)
- Configure auto-restart
- Monitor resource usage
- Dependencies: T919
- Estimated Time: 5 minutes

**T921-Create Admin Dashboard**: Add simple admin page
- Create /admin route
- Add basic stats queries
- Display user count
- Show recent activity
- Dependencies: T920
- Estimated Time: 10 minutes

**T922-Create Health Check**: Add monitoring endpoint
- Create `/api/health` route
- Check database connection
- Return JSON status
- Configure in Coolify
- Dependencies: T921
- Estimated Time: 5 minutes

## Coolify Deployment

**T923-Configure Auto-Deploy**: Set up automatic deployment
- Enable auto-deploy in Coolify
- Set deploy branch to main
- Configure build cache
- Test auto-deploy trigger
- Dependencies: T922
- Estimated Time: 5 minutes

**T924-Set Build Commands**: Configure build process
- Set install: npm ci --production=false
- Set build: npm run build
- Set start: npm run start
- Test build process
- Dependencies: T923
- Estimated Time: 5 minutes

**T925-Create Pre-Deploy Script**: Add deployment checks
- Create scripts/pre-deploy.sh
- Add TypeScript check
- Add linting check
- Add build test
- Dependencies: T924
- Estimated Time: 8 minutes

**T926-Test Deployment**: Verify deployment works
- Push code to main branch
- Monitor Coolify logs
- Check build success
- Verify container starts
- Dependencies: T925
- Estimated Time: 5 minutes

**T927-Configure Rollback**: Plan failure recovery
- Document Coolify rollback
- Note previous deployments
- Test rollback in Coolify
- Document recovery steps
- Dependencies: T926
- Estimated Time: 5 minutes

## Performance Optimization

**T928-Configure Caching**: Set up cache strategies
- Configure Vercel edge caching
- Set cache headers
- Configure CDN
- Test cache effectiveness
- Dependencies: T927
- Estimated Time: 8 minutes

**T929-Optimize Images**: Improve image delivery
- Configure Next.js Image optimization
- Set up image domains
- Test image loading
- Monitor performance
- Dependencies: T928
- Estimated Time: 5 minutes

**T930-Enable Compression**: Reduce payload sizes
- Enable gzip compression
- Configure Brotli if available
- Test compression ratios
- Monitor bandwidth usage
- Dependencies: T929
- Estimated Time: 5 minutes

**T931-Optimize Bundle Size**: Reduce JavaScript size
- Analyze bundle composition
- Remove unused dependencies
- Enable tree shaking
- Test load performance
- Dependencies: T930
- Estimated Time: 10 minutes

## Database Optimization

**T932-Create Database Indexes**: Optimize queries
- Identify slow queries
- Create appropriate indexes
- Test query performance
- Monitor index usage
- Dependencies: T931
- Estimated Time: 10 minutes

**T933-Set Up Materialized Views**: Optimize aggregations
- Create dashboard metrics view
- Set up refresh schedule
- Test view performance
- Monitor refresh times
- Dependencies: T932
- Estimated Time: 8 minutes

**T934-Configure Backup Strategy**: Set up data protection
- Configure automated backups
- Set retention policy
- Test restore process
- Document recovery procedure
- Dependencies: T933
- Estimated Time: 10 minutes

## Testing in Production

**T935-Smoke Test Core Features**: Verify basic functionality
- Test authentication flow
- Test dashboard loading
- Test project navigation
- Test data display
- Dependencies: T934
- Estimated Time: 8 minutes

**T936-Test Export Functionality**: Verify exports work
- Test PDF generation
- Test Excel export
- Check file downloads
- Verify data accuracy
- Dependencies: T935
- Estimated Time: 5 minutes

**T937-Test API Endpoints**: Verify API functionality
- Test all endpoints
- Check authentication
- Verify rate limiting
- Test error handling
- Dependencies: T936
- Estimated Time: 8 minutes

**T938-Load Testing**: Verify performance under load
- Use load testing tool
- Simulate concurrent users
- Monitor response times
- Identify bottlenecks
- Dependencies: T937
- Estimated Time: 10 minutes

## Documentation

**T939-Create Deployment Guide**: Document deployment process
- List all steps
- Include prerequisites
- Add troubleshooting
- Document rollback
- Dependencies: T938
- Estimated Time: 10 minutes

**T940-Create Operations Runbook**: Document operations
- List common tasks
- Document procedures
- Add emergency contacts
- Include escalation paths
- Dependencies: T939
- Estimated Time: 10 minutes

**T941-Create Architecture Diagram**: Document system design
- Draw component diagram
- Show data flow
- Document integrations
- Include network topology
- Dependencies: T940
- Estimated Time: 8 minutes

## Monitoring Configuration

**T942-Set Up Alerts**: Configure monitoring alerts
- Configure error rate alerts
- Set up downtime alerts
- Add performance alerts
- Configure notification channels
- Dependencies: T941
- Estimated Time: 8 minutes

**T943-Create Dashboard**: Build monitoring dashboard
- Set up metrics dashboard
- Add key indicators
- Configure refresh rates
- Share with team
- Dependencies: T942
- Estimated Time: 5 minutes

**T944-Configure Logging**: Set up centralized logging
- Choose logging service
- Configure log aggregation
- Set retention policies
- Create log queries
- Dependencies: T943
- Estimated Time: 8 minutes

## Security Audit

**T945-Run Security Scan**: Check for vulnerabilities
- Run dependency audit
- Check for known CVEs
- Scan for secrets
- Review security headers
- Dependencies: T944
- Estimated Time: 5 minutes

**T946-Review Permissions**: Audit access control
- Review database permissions
- Check API authentication
- Verify role-based access
- Document permissions matrix
- Dependencies: T945
- Estimated Time: 8 minutes

**T947-Test Security Measures**: Verify protections
- Test rate limiting
- Verify input validation
- Check CSRF protection
- Test XSS prevention
- Dependencies: T946
- Estimated Time: 10 minutes

## Go-Live Preparation

**T948-Create Launch Checklist**: Final verification list
- List all critical checks
- Verify all features work
- Check monitoring active
- Confirm backups configured
- Dependencies: T947
- Estimated Time: 5 minutes

**T949-Prepare Rollback Plan**: Document contingency
- Create rollback checklist
- Test rollback locally
- Document timing
- Assign responsibilities
- Dependencies: T948
- Estimated Time: 5 minutes

**T950-Schedule Maintenance Window**: Plan deployment
- Choose low-traffic time
- Notify stakeholders
- Prepare status page
- Set expectations
- Dependencies: T949
- Estimated Time: 3 minutes

## Go-Live Execution

**T951-Deploy to Production**: Execute deployment
- Run deployment command
- Monitor deployment progress
- Verify successful completion
- Check application starts
- Dependencies: T950
- Estimated Time: 10 minutes

**T952-Verify Production**: Confirm functionality
- Test authentication
- Check data display
- Verify all pages load
- Test critical paths
- Dependencies: T951
- Estimated Time: 10 minutes

**T953-Monitor Initial Hours**: Watch for issues
- Monitor error rates
- Check performance metrics
- Review user feedback
- Address urgent issues
- Dependencies: T952
- Estimated Time: 30 minutes

## Post-Deployment

**T954-Document Lessons Learned**: Capture improvements
- Note what went well
- Document issues faced
- List improvements
- Update procedures
- Dependencies: T953
- Estimated Time: 10 minutes

**T955-Update Documentation**: Finalize docs
- Update README
- Update deployment guide
- Add production URLs
- Archive old docs
- Dependencies: T954
- Estimated Time: 5 minutes

**T956-Phase Completion Check**: Final verification
- Verify application live
- Check all monitoring active
- Confirm backups running
- Sign off deployment
- Dependencies: T955
- Estimated Time: 5 minutes

---

## Summary
- Total Tasks: 57 (T900-T956)
- Estimated Total Time: 8-9 hours (plus monitoring time)
- Critical Path: T900 → T901-T903 → T904-T907 → T908-T914 → T915-T922 → T923-T934 → T935-T950 → T951-T956

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
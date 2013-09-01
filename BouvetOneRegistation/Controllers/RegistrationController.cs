using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Diagnostics;
using System.Net;
using System.Threading.Tasks;
using System.Web.Http;
using BouvetOneRegistation.Models;
using System.Linq;

namespace BouvetOneRegistation.Controllers
{
    public class RegistrationController : ApiController
    {
        private readonly RegistrationDbContext _registrationContext;

        public RegistrationController(RegistrationDbContext registrationContext)
        {
            _registrationContext = registrationContext;
        }

        public async Task<IEnumerable<Speaker>> Get()
        {
            try
            {
                return await _registrationContext
                              .Speakers
                              .Include(x => x.Sessions)
                              .ToListAsync();
            }
            catch (Exception e)
            {
                Trace.Write(e.Message);
                throw;
            }

        }
        
        public async Task<HttpStatusCode> Delete(int sessionId)
        {
            try
            {
                var speaker = await _registrationContext.Speakers
                    .Include(inc => inc.Sessions)
                    .FirstAsync(s => s.Sessions.Any(x => x.Id == sessionId));

                var session = speaker.Sessions.First(s => s.Id == sessionId);
                speaker.Sessions.Remove(session);
                await _registrationContext.SaveChangesAsync();
                return HttpStatusCode.NoContent;
            }
            catch (Exception)
            {
                return HttpStatusCode.InternalServerError;
            }
        }

        [HttpPost("registration/speaker")]
        public async Task<int> PostSpeaker([FromBody]string value)
        {
            var speaker = new Speaker
            {
                Name = value
            };
            _registrationContext.Speakers.Add(speaker);
            await _registrationContext.SaveChangesAsync();
            return speaker.Id;
        }

        [HttpPost("registration/session")]
        public async Task<int> PostSession([FromBody] SessionInput sessionInput)
        {
            var speaker = await _registrationContext.Speakers.FindAsync(sessionInput.Id);
            var session = new Session
                              {
                                  Title = sessionInput.Title,
                                  Description = sessionInput.Description,
                                  Level = sessionInput.Level
                              };
            speaker.Sessions.Add(session);
            await _registrationContext.SaveChangesAsync();
            return session.Id;
        }
    }

    public class SessionInput
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string Level { get; set; }
    }
}

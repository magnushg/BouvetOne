using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Diagnostics;
using System.Threading.Tasks;
using System.Web.Http;
using BouvetOneRegistation.Models;

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
            speaker.Sessions.Add(new Session
                            {
                                Title = sessionInput.Title,
                                Description = sessionInput.Description,
                                Level = sessionInput.Level
                            });

            return await _registrationContext.SaveChangesAsync();
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

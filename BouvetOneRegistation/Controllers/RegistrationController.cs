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
        public async Task<IEnumerable<Speaker>> Get()
        {
            try
            {
                using (var context = new RegistrationDbContext())
                {
                    return await context
                        .Speakers
                        .Include(x => x.Sessions)
                        .ToListAsync();
                }
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
            using (var context = new RegistrationDbContext())
            {
                var speaker = new Speaker
                                  {
                                      Name = value
                                  };
                context.Speakers.Add(speaker);
                await context.SaveChangesAsync();
                return speaker.Id;
            }
        }

        [HttpPost("registration/session")]
        public async Task<int> PostSession([FromBody] SessionInput sessionInput)
        {
            using (var context = new RegistrationDbContext())
            {
                var speaker = await context.Speakers.FindAsync(sessionInput.Id);
                speaker.Sessions.Add(new Session
                                         {
                                            Title  = sessionInput.Title,
                                            Description = sessionInput.Description,
                                            Level = sessionInput.Level
                                         });
                return await context.SaveChangesAsync();
            }
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

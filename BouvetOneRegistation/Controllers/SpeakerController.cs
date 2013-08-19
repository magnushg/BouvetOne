using System.Collections.Generic;
using System.Data.Entity;
using System.Threading.Tasks;
using System.Web.Http;
using BouvetOneRegistation.Models;

namespace BouvetOneRegistation.Controllers
{
    public class SpeakerController : ApiController
    {
        public async Task<IEnumerable<Speaker>> Get()
        {
            using (var context = new RegistrationDbContext())
            {
               return await context.Speakers.ToListAsync();
            }
        }

        public async void Post(Speaker speaker)
        {
            using (var context = new RegistrationDbContext())
            {
                context.Speakers.Add(speaker);
                await context.SaveChangesAsync();
            }
        }
    }
}

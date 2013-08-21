using System.Collections.Generic;
namespace BouvetOneRegistation.Models
{
    public class Speaker
    {
        public Speaker()
        {
            Sessions = new List<Session>();
        }

        public int Id { get; set; }
        public string Name { get; set; }
        public ICollection<Session> Sessions { get; set; }
    }
}

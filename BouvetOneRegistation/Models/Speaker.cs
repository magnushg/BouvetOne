using System.Collections.Generic;
namespace BouvetOneRegistation.Models
{
    public class Speaker
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public List<Session> Sessions { get; set; }
    }
}
